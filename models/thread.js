var gatepost = require('gatepost');

var Thread = new gatepost.Model({
    id: {type: 'integer', primary: true},
    forum_id: {type: 'integer', required: true},
    author: {type: 'string'},
    subject: {type: 'string', required: true},
    open: {type: 'boolean', required: true, default: true},
    locked: {type: 'boolean', required: true, default:false},
    tags: {type: 'array'},
    create: {type: 'date'},
    updated: {type: 'date'}
},
{
    name: 'thread',
    cache: true
});

Thread.registerFactorySQL({
    name: "get",
    sql: [
        "SELECT threads.id, threads.forum_id, threads.author, threads.subject, threads.open, threads.locked, threads.tags, threads.created, threads.updated",
        "FROM threads",
        "JOIN forums ON threads.forum_id=forums.id",
        "JOIN forums_access ON forums_access.forum_id=forums.id",
        "WHERE threads.id=$thread_id AND (forums_access.user_id=$user_id OR forums.owner=$user_id)"
    ].join(' '),
    oneResult: true
});

Thread.registerFactorySQL({
    name: "delete",
    sql: [
        "DELETE FROM threads WHERE id=$arg"
    ].join(' '),
    oneArg: true,
    oneResult: true
});

var ThreadPage = new gatepost.Model({
    results: {collection: 'thread'},
    count: {type: 'integer'},
    total: {type: 'integer'}
});

ThreadPage.registerFactorySQL({
    name: "all",
    sql: [
        "SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='threads') AS total,",
        "json_agg(row_to_json(thread_rows)) as results,",
        "count(thread_rows.*) as count",
        'FROM (SELECT threads.id, threads.forum_id, threads.author, threads.subject, threads.open, threads.locked, threads.tags, threads.created, threads.updated',
        'FROM threads',
        'JOIN forums ON threads.forum_id=forums.id',
        'JOIN forums_access ON forums.id=forums_access.forum_id',
        'WHERE user_id=$user_id OR forums.owner=$user_id',
        'ORDER BY threads.id LIMIT $limit OFFSET $offset) thread_rows'
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

Thread.insert = function (thread, user, callback) {
    var db = this.getDB();
    db.query("SELECT create_thread($thread, $user) AS id", {thread: thread, user: user}, function (err, results) {
        if (err || results.rows.length == 0) {
            return callback(err);
        } else {
            thread.id = results.rows[0].id;
            return callback(err, results.rows[0].id);
        }
    });
};

Thread.registerFactorySQL({
    name: 'update',
    sql: [
        'SELECT * from update_thread($thread, $user_id)'
    ].join(' '),
    oneResult: true
});

ThreadPage.registerFactorySQL({
    name: "allByForum",
    sql: [
        "SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='threads') AS total,",
        "json_agg(row_to_json(thread_rows)) as results,",
        "count(thread_rows.*) as count",
        'FROM (SELECT threads.id, threads.forum_id, threads.author, threads.subject, threads.open, threads.locked, threads.tags, threads.created, threads.updated',
        'FROM threads',
        'JOIN forums ON forums.id=threads.forums_id',
        'JOIN forums_access ON forums_access.forum_id=forums.id', 
        'WHERE forum_id=$forum_id AND forums_access.user_id=$user_id',
        'ORDER BY id LIMIT $limit OFFSET $offset) thread_rows'
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

Thread.all = ThreadPage.all;
Thread.allByForum = ThreadPage.allByForum;


module.exports = Thread;
