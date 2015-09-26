CREATE OR REPLACE FUNCTION create_forum(forum JSON, user_id TEXT) RETURNS SETOF forums as $$
DECLARE
    result INTEGER;
BEGIN
    IF (json_typeof(forum->'parent_id') IS NOT NULL) THEN
        PERFORM check_write_access(user_id, (forum->>'parent_id')::integer);
    ELSE
        RAISE EXCEPTION 'cannot_create_root_forum';
    END IF;
    INSERT INTO forums (owner, name, description, parent_id) VALUES (user_id, forum->>'name', forum->>'description', (forum->>'parent_id')::integer) RETURNING id INTO result;
    RETURN QUERY SELECT * FROM forums WHERE id=result;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_forum(forum JSON, user_id TEXT) RETURNS SETOF forums as $$
DECLARE
BEGIN
    IF EXISTS (SELECT key FROM json_object_keys(forum) AS key WHERE key='parent_id' AND json_typeof(forum->key) IS NULL) THEN
        IF (SELECT json_typeof(forum->'parent_id') IS NOT NULL) THEN
            PERFORM check_write_access(user_id, (forum->>'parent_id')::integer);
        ELSE
            RAISE EXCEPTION 'cannot have null parent for forum';
        END IF;
    END IF;
    PERFORM check_write_access(user_id, (forum->>'id')::integer);
    EXECUTE generate_update_query(forum, 'forums');
    RETURN QUERY SELECT * FROM forums WHERE id=(forum->>'id')::integer;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_thread(thread JSON, user_id TEXT) RETURNS SETOF threads as $$
DECLARE
    result INTEGER;
BEGIN
    PERFORM check_post_access(user_id, (thread->>'forum_id')::integer);
    INSERT INTO threads (forum_id, author, subject, open, locked, tags) VALUES ((thread->>'forum_id')::integer, user_id, thread->>'subject', (thread->>'open')::boolean, (thread->>'locked')::boolean, (select array_agg(x) as tags FROM json_array_elements_text(thread->'tags') AS x)) RETURNING id INTO result;
    INSERT INTO forums_log (forum_id, tbl, other_id, op) VALUES ((thread->>'forum_id')::integer, 'threads', result, 'INSERT');
    RETURN QUERY SELECT * FROM threads WHERE id=result;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_thread(thread JSON, user_id TEXT) RETURNS SETOF forums as $$
DECLARE
BEGIN
    PERFORM check_post_access(user_id, (thread->>'forum_id')::integer);
    IF EXISTS (SELECT id FROM threads WHERE id=(thread->>'id')::integer AND author != user_id) THEN
        RAISE EXCEPTION 'Can not edit thread that is not yours';
    END IF;
    IF EXISTS (SELECT key FROM json_object_keys(threads) AS key WHERE key = 'author') THEN
        RAISE EXCEPTION 'cannot change thread author';
    END IF;
    EXECUTE generate_update_query(thread, 'threads');
    INSERT INTO forums_log (forum_id, tbl, other_id, op) VALUES ((thread->>'forum_id')::integer, 'threads', (thread->>'id')::integer, 'UPDATE');
    RETURN QUERY SELECT * FROM forums WHERE id=(forum->>'id')::integer;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_post(post JSON, user_id TEXT) RETURNS SETOF posts as $$
DECLARE
    result INTEGER;
    f_id INTEGER;
BEGIN
    SELECT threads.forum_id FROM threads WHERE id=(post->>'thread_id')::integer INTO f_id;
    PERFORM check_post_access(user_id, f_id);
    INSERT INTO posts (author, body, parent_id, thread_id) VALUES (user_id, post->>'body', (post->>'parent_id')::integer, (post->>'thread_id')::integer) RETURNING id INTO result;
    INSERT INTO forums_log (forum_id, tbl, other_id, op) VALUES (f_id, 'posts', result, 'INSERT');
    RETURN QUERY SELECT * FROM posts WHERE id=result;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_post(post JSON, user_id TEXT) RETURNS SETOF posts as $$
DECLARE
    key TEXT;
    sets TEXT[];
    f_id INTEGER;
BEGIN
    SELECT threads.forum_id FROM posts JOIN threads ON threads.id=posts.thread_id WHERE posts.id=(post->>'id')::integer INTO f_id;
    PERFORM check_post_access(user_id, f_id);
    IF EXISTS (SELECT id FROM posts WHERE id=(post->>'id')::integer AND author != user_id) THEN
        RAISE EXCEPTION 'Can not edit post that is not yours';
    END IF;
    EXECUTE generate_update_query(post, 'posts');
    INSERT INTO forums_log (forum_id, tbl, other_id, op) VALUES (f_id, 'posts', (post->>'id')::integer, 'UPDATE');
    RETURN QUERY SELECT id, body, author, thread_id, parent_id, path, created, updated FROM posts WHERE id=(post->>'id')::integer;
END;
$$ language 'plpgsql';
