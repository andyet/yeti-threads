"use strict";

let gatepost = require('gatepost');
let joi = require('joi');
let knex = require('knex')({dialect: 'pg'});

let Forum = new gatepost.Model({
    id: {
        validate: joi.number().integer(),
        primary: true
    },
    owner: {
        validate: joi.string()
    },
    name: {
        validate: joi.string().max(30)
    },
    description: {
        validate: joi.string().max(200)
    },
    parent_id: {
        validate: joi.number().integer()
    },
    path: {
        validate: joi.string().max(255)
    },
    forums: {collection: 'this'},
    created: {validate: joi.date()},
    updated: {validate: joi.date()}
},
{
    cache: true,
    name: 'forum'
});


let ForumTree = new gatepost.Model({
    results: {type: 'array'}
});

ForumTree.fromSQL({
    name: "get",
    sql: () => gatepost.SQL`select array_to_json(ARRAY(select array_to_json(array_agg(json_build_object(f2.id, f2.name))) as results from forums f1 join forums f2 ON f2.id::text=ANY(string_to_array(f1.path::text, '.')) GROUP BY f1.path)) as results`,
    oneResult: true
});

Forum.getTree = ForumTree.get;

let IdArray = new gatepost.Model({
    ids: {
        validate: joi.array(),
        default: function () { return []; },
        processIn: function (value) {
            if (value === null || !value) {
                return [];
            }
            return value;
        },
        required: true
    }
});

IdArray.fromSQL({
    name: "getIds",
    sql: (args) => gatepost.SQL`SELECT json_agg(forums.id) AS ids FROM forums JOIN forums_access ON forums.id=forums_access.forum_id WHERE (forums_access.user_id=${args.arg} AND forums_access.read=True) OR forums.owner=${args.arg}`,
    oneArg: true,
    oneResult: true
});

Forum.getIds = IdArray.getIds;

Forum.fromSQL({
    name: 'get',
    sql: (args) => knex.select('id', 'owner', 'name', 'description', 'parent_id', 'path', 'created', 'updated')
        .from('forums')
        .rightJoin('forums_access', 'forums.id', 'forums_access.forum_id')
        .where({id: args.forum_id, 'forums_access.user': args.user_id}),
    oneResult: true
});

Forum.fromSQL({
    name: 'insert',
    instance: true,
    sql: (args, model) => gatepost.SQL`SELECT * FROM create_forum(${model.toJSON()}, ${args.user})`,
    oneResult: true,
    required: true
});

Forum.fromSQL({
    name: 'update',
    instance: true,
    sql: (args, model) => gatepost.SQL`SELECT * from update_forum(${model.toJSON()}, ${args.user})`,
    oneResult: true,
});

Forum.fromSQL({
    name: 'delete',
    sql: (args, model) => gatepost.SQL`DELETE FROM forums WHERE id=${args.forum_id} AND owner=${args.user}`,
    oneResult: true,
});

Forum.fromSQL({
    name: 'getForum',
    sql: (args) => gatepost.SQL`SELECT id, owner, name, description, created, updated, path, (SELECT json_agg(row_to_json(f_rows)) as forums
FROM (select id, owner, name, description, created, updated, path FROM forums AS forum_children
WHERE forum_parent.id=forum_children.parent_id) f_rows) as forums
FROM forums as forum_parent
LEFT JOIN forums_access ON forums_access.forum_id=forum_parent.id AND forums_access.user_id=${args.user_id}
WHERE forum_parent.id=${args.forum_id} AND (forums_access.read=True OR forum_parent.owner=${args.user_id})`,
    oneResult: true
});

let ForumPage = new gatepost.Model({
    results: {collection: 'forum'},
    count: {type: 'integer'},
    total: {type: 'integer'}
});

ForumPage.fromSQL({
    name: "all",
    sql: (args) => gatepost.SQL`SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='forums') AS total,
json_agg(row_to_json(forum_rows)) as results,
count(forum_rows.*) as count
FROM (SELECT id, owner, name, description, parent_id, path, created, updated
FROM forums
LEFT JOIN forums_access ON forums_access.forum_id=forums.id AND forums_access.user_id=${args.user_id}
WHERE forums_access.read=True OR forums.owner=${args.user_id}
ORDER BY id LIMIT ${args.limit} OFFSET ${args.offset}) forum_rows`,
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

Forum.all = ForumPage.all;

module.exports = Forum;
