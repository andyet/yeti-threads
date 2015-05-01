DROP DATABASE forum;
CREATE DATABASE forum WITH OWNER fritzy ENCODING 'UTF8';
\connect forum;

CREATE EXTENSION ltree;
CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION citext;

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = now();
    RETURN NEW;
END;
$$ language 'plpgsql';


CREATE OR REPLACE FUNCTION get_calculated_path(INT, TEXT)
  RETURNS ltree AS
$$
DECLARE
    result ltree;
BEGIN
    EXECUTE format('SELECT CASE WHEN parent_id IS NULL THEN %L::text::ltree ELSE get_calculated_path(parent_id, %L) || id::text END FROM %I WHERE id = %L', $1, $2, $2, $1) INTO result;
    RETURN result;
END
$$
LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION triggered_update_path() RETURNS trigger AS
$$
DECLARE
    tbl text = quote_ident(TG_TABLE_NAME);
BEGIN
  IF TG_OP = 'UPDATE' THEN
        IF (COALESCE(OLD.parent_id, 0) != COALESCE(NEW.parent_id, 0)) THEN
            -- update all nodes that are children of this one including this one
            EXECUTE format('UPDATE %I SET path = get_calculated_path(id, %L) WHERE %L @> path', tbl, tbl, OLD.path);
        END IF;
  ELSIF TG_OP = 'INSERT' THEN
        EXECUTE format('UPDATE %I SET path = get_calculated_path(%L, %L) WHERE id = %L', tbl, NEW.id, tbl, NEW.id);
  END IF;

  RETURN NEW;
END
$$
LANGUAGE 'plpgsql' VOLATILE;

CREATE OR REPLACE FUNCTION triggered_check_permissions() RETURNS TRIGGER AS $$
DECLARE
BEGIN
    IF NOT EXISTS (SELECT write FROM forums_access WHERE (forum_id=OLD.forum_id OR forum_id=NEW.forum_id) AND forums_access.user_id=NEW.user_id AND write=True) THEN
        RAISE EXCEPTION 'no_write_access';
    END IF;
END
$$ LANGUAGE plpgsql;

--FORUMS
CREATE TABLE forums (
    id SERIAL PRIMARY KEY,
    owner TEXT,
    name CITEXT,
    description TEXT,
    parent_id INTEGER REFERENCES forums(id) ON DELETE SET NULL,
    path LTREE,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_forums_path on forums USING GIST (path);
CREATE INDEX idx_forums_owner on forums(owner);
CREATE INDEX idx_forums_name on forums(name);

CREATE TRIGGER trigger_update_forum_path AFTER INSERT OR UPDATE OF id, parent_id ON forums FOR EACH ROW EXECUTE PROCEDURE triggered_update_path();
CREATE TRIGGER update_forums_updated BEFORE UPDATE ON forums FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id) ON DELETE CASCADE,
    author TEXT,
    subject TEXT,
    open BOOLEAN NOT NULL DEFAULT True,
    locked BOOLEAN NOT NULL DEFAULT False,
    tags TEXT[],
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- tags @> array['foo','bar','baz']

CREATE TRIGGER update_threads_updated BEFORE UPDATE ON threads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE INDEX idx_threads_tags on threads USING GIN (tags);
create index idx_threads_author on threads(author);
create index idx_threads_open on threads(open);
CREATE INDEX idx_threads_forum_id on threads(forum_id);

CREATE TABLE threads_references (
    from_thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    to_thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    UNIQUE(from_thread_id, to_thread_id)
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author TEXT,
    body TEXT,
    parent_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
    thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    path LTREE,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_author on threads(author);

CREATE TRIGGER update_posts_updated BEFORE UPDATE ON posts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER trigger_update_post_path AFTER INSERT OR UPDATE OF id, parent_id ON posts FOR EACH ROW EXECUTE PROCEDURE triggered_update_path();

--INSERT INTO forums (name, parent_id) values ('root', null), ('sub1', 1), ('sub2', 1), ('sub3', 3);

CREATE TABLE forums_access (
    user_id TEXT,
    forum_id INTEGER REFERENCES forums(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    write BOOLEAN DEFAULT FALSE,
    post BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, forum_id)
);

CREATE OR REPLACE FUNCTION check_read_access(userid TEXT, f_id INTEGER) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT * FROM forums_access WHERE user_id=userid AND forum_id=f_id AND read=TRUE) THEN
        IF NOT EXISTS (SELECT id FROM forums WHERE owner=userid AND id=f_id) THEN
            RAISE EXCEPTION 'read_not_allowed';
        END IF;
    END IF;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION check_write_access(userid TEXT, f_id INTEGER) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT * FROM forums_access WHERE user_id=userid AND forum_id=f_id AND write=TRUE) THEN
        IF NOT EXISTS (SELECT id FROM forums WHERE owner=userid AND id=f_id) THEN
            RAISE EXCEPTION 'write_not_allowed';
        END IF;
    END IF;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION check_post_access(userid TEXT, f_id INTEGER) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT * FROM forums_access WHERE user_id=userid AND forum_id=f_id AND post=TRUE) THEN
        IF NOT EXISTS (SELECT id FROM forums WHERE owner=userid AND id=f_id) THEN
            RAISE EXCEPTION 'post_not_allowed';
        END IF;
    END IF;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_forum(forum JSON, user_id TEXT) RETURNS INTEGER as $$
DECLARE
    result INTEGER;
BEGIN
    IF (json_typeof(forum->'parent_id') IS NOT NULL) THEN
        PERFORM check_write_access(user_id, (forum->>'parent_id')::integer);
    ELSE
        RAISE EXCEPTION 'cannot_create_root_forum';
    END IF;
    INSERT INTO forums (owner, name, description, parent_id) VALUES (user_id, forum->>'name', forum->>'description', (forum->>'parent_id')::integer) RETURNING id INTO result;
    RETURN result;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_forum(forum JSON, user_id TEXT) RETURNS SETOF forums as $$
DECLARE
    key TEXT;
    sets TEXT[];
BEGIN
    PERFORM check_write_access(user_id, (forum->>'id')::integer);
    IF (SELECT json_typeof(forum->'parent_id') IS NOT NULL) THEN
        PERFORM check_write_access(user_id, (forum->>'parent_id')::integer);
    END IF;
    FOR key IN
        SELECT json_object_keys(forum)
    LOOP
        IF (key != 'id') THEN
            SELECT array_append(sets, format('%I=%L', key, forum->>key)) INTO sets;
        END IF;
    END LOOP;
    EXECUTE 'UPDATE forums SET ' || array_to_string(sets, ', ') || format(' WHERE id=%L', (forum->>'id')::integer);
    RETURN QUERY SELECT id, owner, name, description, parent_id, path, created, updated FROM forums WHERE id=(forum->>'id')::integer;
END;
$$ language 'plpgsql';

INSERT INTO forums (name) VALUES ('Root Forum');
