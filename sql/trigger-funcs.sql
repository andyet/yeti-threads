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

CREATE OR REPLACE FUNCTION log_forums_change() RETURNS trigger AS $$
DECLARE
  id bigint;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    id = NEW.id;
    IF TG_OP = 'INSERT' AND NEW.owner IS NOT NULL THEN
        INSERT INTO forums_access (user_id, forum_id, read, write, post) VALUES (NEW.owner, NEW.id, True, True, True);
    END IF;
  ELSE
    id = OLD.id;
  END IF;
  INSERT INTO forums_log (forum_id, tbl, op) VALUES (id, TG_TABLE_NAME, TG_OP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_forums_log() RETURNS trigger AS $$
DECLARE
    url_path TEXT;
BEGIN
    IF NEW.tbl = 'forums' THEN
        url_path = '/forums/' || NEW.forum_id::text;
    ELSE
        url_path = '/' || NEW.tbl || '/' || NEW.other_id::text;
    END IF;
    PERFORM pg_notify('forums_log', json_build_object('forum_id', NEW.forum_id, 'url_path', url_path, 'table', NEW.tbl, 'other_id', NEW.other_id, 'type', NEW.op, 'when', NEW.time)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_access_log() RETURNS trigger AS $$
DECLARE
    url_path TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('access_log', json_build_object('user_id', OLD.user_id, 'forum_id', OLD.forum_id, 'access', False)::text);
        RETURN OLD;
    ELSE 
        PERFORM pg_notify('access_log', json_build_object('user_id', NEW.user_id, 'forum_id', NEW.forum_id, 'access', NEW.read)::text);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;
