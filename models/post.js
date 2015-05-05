var gatepost = require('gatepost');

var Post = new gatepost.Model({
    id: {type: 'integer', primary: true},
    author: {type: 'string'},
    body: {type: 'string'},
    parent_id: {type: 'integer'},
    thread_id: {type: 'integer'},
    path: {
        processIn: function (value) {
            if (!value) {
                return [];
            }
            return value.split('.');
        },
        processOut: function (value) {
            if (!value) {
                return '';
            }
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
        "SELECT posts.id, posts.author, posts.body, posts.parent_id, posts.thread_id, posts.path, posts.created, posts.updated FROM posts",
        "JOIN threads ON posts.thread_id=threads.id",
        "JOIN forums ON threads.forum_id=forums.id",
        "JOIN forums_access ON forums_access.forum_id=forums.id",
        "WHERE posts.id=$post_id AND ((forums_access.user_id=$user_id AND forums_access.read=True) OR forums.owner=$user_id)"
    ].join(' '),
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

Post.insert = function (post, user, callback) {
    var db = this.getDB();
    db.query("SELECT create_post($post, $user) AS id", {post: post, user: user}, function (err, results) {
        if (err || results.rows.length == 0) {
            return callback(err);
        } else {
            post.id = results.rows[0].id;
            return callback(err, results.rows[0].id);
        }
    });
};

Post.registerFactorySQL({
    name: 'update',
    sql: [
        'SELECT * from update_post($post, $user_id)'
    ].join(' '),
    oneResult: true
});


PostPage.registerFactorySQL({
    name: "all",
    sql: [
        "SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='posts') AS total,",
        "json_agg(row_to_json(post_rows)) as results,",
        "count(post_rows.*) as count",
        'FROM (SELECT id, author, body, parent_id, thread_id, path, created, updated',
        'FROM posts',
        "JOIN threads ON posts.thread_id=threads.id",
        "JOIN forums ON threads.forum_id=forums.id",
        "JOIN forums_access ON forums_access.forum_id=forums.id",
        "WHERE (forums_access.user_id=$user_id AND forums_access.read=True) OR forums.owner=$user_id",
        'ORDER BY posts.id LIMIT $limit OFFSET $offset) post_rows'
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
"SELECT (SELECT count(id) FROM posts WHERE thread_id=$thread_id) AS total,",
"json_agg(row_to_json(post_rows)) as results,",
"count(post_rows.*) as count",
"FROM (WITH RECURSIVE included_posts(id, author, body, parent_id, thread_id, path, created, updated) AS (",
"    SELECT id, author, body, parent_id, thread_id, path, created, updated FROM posts WHERE parent_id IS NULL AND thread_id=$thread_id",
"UNION ALL",
"    SELECT p.id, p.author, p.body, p.parent_id, p.thread_id, p.path, p.created, p.updated FROM included_posts inc_p, posts p WHERE p.parent_id=inc_p.id",
")",
"SELECT * FROM included_posts",
"JOIN threads ON included_posts.thread_id=threads.id",
"JOIN forums ON threads.forum_id=forums.id",
"JOIN forums_access ON forums_access.forum_id=forums.id",
"WHERE (forums_access.user_id=$user_id AND forums_access.read=True) OR forums.owner=$user_id",
"ORDER BY included_posts.path LIMIT $limit OFFSET $offset) post_rows"
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

Post.all = PostPage.all;
Post.allByThread = PostPage.allByThread;

module.exports = Post;
