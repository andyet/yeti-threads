CREATE TRIGGER trigger_forums_path AFTER INSERT OR UPDATE OF id, parent_id ON forums FOR EACH ROW EXECUTE PROCEDURE triggered_update_path();
CREATE TRIGGER trigger_forums_updated BEFORE UPDATE ON forums FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER trigger_forums_changes AFTER DELETE OR UPDATE OR INSERT ON forums FOR EACH ROW EXECUTE PROCEDURE log_forums_change();


CREATE TRIGGER update_threads_updated BEFORE UPDATE ON threads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_posts_updated BEFORE UPDATE ON posts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER trigger_update_post_path AFTER INSERT OR UPDATE OF id, parent_id ON posts FOR EACH ROW EXECUTE PROCEDURE triggered_update_path();


CREATE TRIGGER trigger_forums_access_notify AFTER INSERT OR UPDATE OR DELETE ON forums_access FOR EACH ROW EXECUTE PROCEDURE notify_access_log();
CREATE TRIGGER trigger_forums_log_notify AFTER INSERT ON forums_log FOR EACH ROW EXECUTE PROCEDURE notify_forums_log();
