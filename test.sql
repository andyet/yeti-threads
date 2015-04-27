
WITH RECURSIVE included_forums(id, name, path) AS (
    SELECT id, name, path FROM forums WHERE id=3
UNION ALL
    SELECT f.id, f.name, f.path FROM included_forums inc_f, forums f WHERE f.parent_id=inc_f.id
)
SELECT * FROM included_forums;


WITH RECURSIVE included_forums(parent) AS (
    SELECT row_to_json(root) parent
    FROM (SELECT id, slug, path FROM forums WHERE id=1) AS root
UNION ALL
    SELECT row_to_json(f_row) forum
    FROM (SELECT f.id, f.slug, f.path  FROM included_forums inc_f, forums f WHERE f.parent_id=(inc_f.parent->'id')::text::integer) as f_row
)
SELECT * FROM included_forums;

WITH RECURSIVE included_forums(id, slug, path, children) AS (
    SELECT id, slug, path, json_agg(child_rows) as children FROM forums AS f1 JOIN LATERAL (SELECT id, slug, path FROM forums as f2 WHERE f1.id=f2.parent_id) child_rows WHERE id=1
UNION ALL
    SELECT f.id, f.slug, f.path  FROM included_forums inc_f, forums f WHERE f.parent_id=inc_f.id
)
SELECT * FROM included_forums WHERE path ~{1};

SELECT row_to_json(forum_row) AS forum
        FROM (SELECT id, owner, slug, description, created, updated, path, (SELECT json_agg(row_to_json(f_rows)) as forums
        FROM (select id, owner, slug, description, created, updated, path FROM forums AS forum_children
        WHERE forum_parent.id=forum_children.parent_id) f_row\ths) as children
        FROM forums as forum_parent WHERE forum_parent.id=1) forum_row

 
