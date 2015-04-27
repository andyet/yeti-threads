var gatepost = require('gatepost');

var Forum = new gatepost.Model({
    id: {type: 'integer'},
    owner: {type: 'string'},
    name: {},
    description: {},
    parent_id: {},
    path: {},
    forums: {collection: 'this'},
    created: {type: 'datetime'},
    updated: {type: 'datetime'}
},
{
    cache: true,
    name: 'forum'
});

Forum.registerInsert({table: 'forums'});
Forum.registerUpdate({table: 'forums'});

var ForumTree = new gatepost.Model({
    results: {type: 'array'}
});

ForumTree.registerFactorySQL({
    name: "get",
    sql: [
        "select array_to_json(ARRAY(select array_to_json(array_agg(json_build_object(f2.id, f2.name))) as results from forums f1 join forums f2 ON f2.id::text=ANY(string_to_array(f1.path::text, '.')) GROUP BY f1.path)) as results"
    ].join(' '),
    oneResult: true
});

Forum.getTree = ForumTree.get;


Forum.registerFactorySQL({
    name: 'get',
    sql: [
        'SELECT id, owner, name, description, created, updated',
        'FROM forums WHERE id=$arg'
    ].join(' '),
    oneArg: true,
    oneResult: true
});

Forum.registerFactorySQL({
    name: 'getForum',
    sql: [
        "SELECT id, owner, name, description, created, updated, path, (SELECT json_agg(row_to_json(f_rows)) as forums",
        "FROM (select id, owner, name, description, created, updated, path FROM forums AS forum_children",
        "WHERE forum_parent.id=forum_children.parent_id) f_rows) as forums",
        "FROM forums as forum_parent WHERE forum_parent.id=$arg"
    ].join(' '),
    oneArg: true,
    oneResult: true
});

Forum.registerFactorySQL({
    name: 'delete',
    sql: "DELETE FROM forums WHERE id=$arg",
    oneArg: true,
    oneResult: true
});

module.exports = Forum;
