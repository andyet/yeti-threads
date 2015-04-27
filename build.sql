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

--FORUM PERMISSIONS
CREATE TABLE forums_permissions (
    "user" TEXT,
    forum_id INTEGER REFERENCES forums(id) ON DELETE CASCADE,
    permissions TEXT[],
    UNIQUE("user", forum_id)
);

CREATE TABLE threads (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id) ON DELETE CASCADE,
    author TEXT,
    subject TEXT,
    tags TEXT[],
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- tags @> array['foo','bar','baz']

CREATE TRIGGER update_threads_updated BEFORE UPDATE ON threads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE INDEX idx_threads_tags on threads USING GIN (tags);
CREATE INDEX idx_threads_author on threads(author);
CREATE INDEX idx_threads_forum_id on threads(forum_id);

CREATE TABLE threads_permission (
    "user" TEXT,
    thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
    permissions TEXT[],
    UNIQUE("user", thread_id)
);

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

INSERT INTO forums (name, parent_id) values ('root', null), ('sub1', 1), ('sub2', 1), ('sub3', 3);
