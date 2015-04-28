var gatepost = require('gatepost');

var Post = new gatepost.Model({
    id: {type: 'integer', primary: true},
    author: {type: 'string'},
    body: {type: 'string'},
    parent_id: {type: 'integer'},
    thread_id: {type: 'integer'},
    path: {
        processIn: function (value) {
            return value.split('.');
        },
        processOut: function (value) {
            return value.join('.');
        }
    },
    created: {type: 'date'},
    updated: {type: 'date'}
}, {
    name: 'post',
    cach: true
});

var PostPage = new gatepost.Model({
    count: {type: 'integer'},
    total: {type: 'integer'},
    results: {collection: Post}
});

Post.registerFactorySQL({
    name: "get",
    sql: [
        "SELECT id, author, body, parent_id, thread_id, path, created, updated FROM posts WHERE id=$arg"
    ].join(' '),
    oneArg: true,
    oneResult: true
});

Post.registerFactorySQL({
    name: "delete",
    sql: [
        "DELETE FROM posts WHERE id=$arg"
    ].join(' '),
    oneArg: true,
    oneResult: true
});

Post.registerInsert({table: 'posts'});
Post.registerUpdate({table: 'posts'});

PostPage.registerFactorySQL({
    name: "all",
    sql: [
        "SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='posts') AS total,",
        "json_agg(row_to_json(post_rows)) as results,",
        "count(post_rows.*) as count",
        'FROM (SELECT id, author, body, parent_id, thread_id, path, created, updated',
        'FROM posts ORDER BY id LIMIT $limit OFFSET $offset) post_rows'
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

/*
PostPage.registerFactorySQL({
    name: "listByThread",
    sql: [
        "SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='posts') AS total,",
        "json_agg(row_to_json(post_rows)) as results,",
        "count(post_rows.*) as count",
        'FROM (SELECT id, author, body, parent_id, thread_id, path, created, updated',
        'FROM posts WHERE thread_id=$thread_id ORDER BY id LIMIT $limit OFFSET $offset) post_rows'
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});
*/
PostPage.registerFactorySQL({
    name: 'allByThread',
    sql: [
"SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='posts') AS total,",
"json_agg(row_to_json(post_rows)) as results,",
"count(post_rows.*) as count",
"FROM (WITH RECURSIVE included_posts(id, author, body, parent_id, thread_id, path, created, updated) AS (",
"    SELECT id, author, body, parent_id, thread_id, path, created, updated FROM threads WHERE parent_id=NULL AND thread_id=$thread_id",
"UNION ALL",
"    SELECT p.id, p.author, p.body, p.parent_id, p.thread_id, p.path, p.created, p.updated FROM included_posts inc_p, posts p WHERE p.parent_id=inc_p.id",
")",
"SELECT * FROM included_forums ORDER BY path LIMIT $limit OFFSET $offset) post_rows"
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

Post.all = PostPage.all;
Post.allByThread = PostPage.allByThread;

