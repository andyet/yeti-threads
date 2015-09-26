"use strict";

let gatepost = require('gatepost');
let SQL = require('sql-template-strings');

let Access = new gatepost.Model({
    user_id: {type: 'string'},
    forum_id: {type: 'integer'},
    read: {type: 'boolean', required: true, default: false},
    write: {type: 'boolean', required: true, default: false},
    post: {type: 'boolean', required: true, default: false}
}, {
    name: 'access'
});

Access.registerFactorySQL({
    name: "get",
    sql: (args) => SQL`SELECT user_id, forum_id, read, write, post FROM access WHERE user_id=${args.user_id} AND forum_id=${args.forum_id}`,
    oneResult: true
});

let AccessPage = new gatepost.Model({
    count: {type: 'integer'},
    total: {type: 'integer'},
    results: {collection: Access}
});

AccessPage.fromSQL({
    name: "list",
    sql: (args) => SQL`SELECT user_id, forum_id, read, write, post FROM access LIMIT $limit OFFSET $(args.offset) ORDER BY user_id, forum_id`,
    defaults: {
        limit: 20,
        offset: 0
    }
});

AccessPage.fromSQL({
    name: "listByUser",
    sql: (args) => SQL`SELECT user_id, forum_id, read, write FROM access WHERE user_id=${args.user_id} LIMIT ${args.limit} OFFSET ${args.offset} ORDER BY forum_id`,
    defaults: {
        limit: 20,
        offset: 0
    }
});

AccessPage.fromSQL({
    name: "listByForum",
    sql: (args, model) => SQL`SELECT user_id, forum_id, read, write FROM access WHERE forum_id=${args.forum_id} LIMIT $limit OFFSET ${args.offset} ORDER BY user_id`,
    defaults: {
        limit: 20,
        offset: 0
    }
});

Access.list = AccessPage.list;

Access.fromSQL({
    name: 'insert',
    instance: true,
    sql: (args, model) => SQL`INSERT INTO forums_access (user_id, forum_id, read, write, post) VALUES (${model.user_id}, ${model.forum_id}, ${model.read}, ${model.write}, ${model.post})`,
});

Access.fromSQL({
    name: 'update',
    instance: true,
    sql: (args, model) => SQL`UPDATE forums_access SET read=${model.read}, write=${model.write}, post=${model.post} WHERE user_id=${model.user_id}, forum_id=${model.forum_id}`,
});


module.exports = Access;
