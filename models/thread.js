var gatepost = require('gatepost');

var Thread = new gatepost.Model({
    id: {type: 'integer', primary: true},
    forum_id: {type: 'integer', required: true},
    author: {type: 'string'},
    subject: {type: 'string', required: true},
    open: {type: 'boolean', required: true, default: true},
    locked: {type: 'boolean'},
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
        "SELECT id, forum_id, author, subject, open, locked, tags, created, updated FROM threads WHERE id=$arg"
    ].join(' '),
    oneArg: true,
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
        'FROM (SELECT id, forum_id, author, subject, open, locked, tags, created, updated',
        'FROM threads ORDER BY id LIMIT $limit OFFSET $offset) thread_rows'
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

ThreadPage.registerFactorySQL({
    name: "allByForum",
    sql: [
        "SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='threads') AS total,",
        "json_agg(row_to_json(thread_rows)) as results,",
        "count(thread_rows.*) as count",
        'FROM (SELECT id, forum_id, author, subject, open, locked, tags, created, updated',
        'FROM threads WHERE forum_id=$forum_id ORDER BY id LIMIT $limit OFFSET $offset) thread_rows'
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

Thread.all = ThreadPage.all;
Thread.allByForum = ThreadPage.allByForum;

Thread.registerInsert({table: 'threads'});
Thread.registerUpdate({table: 'threads'});


