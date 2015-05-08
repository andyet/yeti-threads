CREATE OR REPLACE FUNCTION generate_update_query(value JSON, tbl TEXT) RETURNS TEXT as $$
DECLARE
    key TEXT;
    sets TEXT[];
BEGIN
    FOR key IN
        SELECT json_object_keys(value)
    LOOP
        IF (key != 'id') THEN
            SELECT array_append(sets, format('%I=%L', key, value->>key)) INTO sets;
        END IF;
    END LOOP;
    RETURN format('UPDATE %I SET ', tbl) || array_to_string(sets, ', ') || format(' WHERE id=%L', (value->>'id')::integer);
END;
$$ language 'plpgsql';


CREATE OR REPLACE FUNCTION check_read_access(userid TEXT, f_id INTEGER) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT * FROM forums_access WHERE user_id=userid AND forum_id=f_id AND read=TRUE) THEN
        IF NOT EXISTS (SELECT id FROM forums WHERE owner=userid AND id=f_id) THEN
            RAISE 'User lacks permission to read from forum: %', f_id USING ERRCODE = 'insufficient_privilege' ;
        END IF;
    END IF;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION check_write_access(userid TEXT, f_id INTEGER) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT * FROM forums_access WHERE user_id=userid AND forum_id=f_id AND write=TRUE) THEN
        IF NOT EXISTS (SELECT id FROM forums WHERE owner=userid AND id=f_id) THEN
            RAISE 'User lacks permission to write to forum: %', f_id USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION check_post_access(userid TEXT, f_id INTEGER) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT * FROM forums_access WHERE user_id=userid AND forum_id=f_id AND post=TRUE) THEN
        IF NOT EXISTS (SELECT id FROM forums WHERE owner=userid AND id=f_id) THEN
            RAISE 'User lacks permission to post to forum: %', f_id USING ERRCODE = 'insufficient_privilege' ;
        END IF;
    END IF;
END;
$$ language 'plpgsql';
