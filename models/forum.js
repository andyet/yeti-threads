var gatepost = require('gatepost');

var Forum = new gatepost.Model({
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
    updated: {vadliate: joi.date()}
},
{
    cache: true,
    name: 'forum'
});


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
        'SELECT id, owner, name, description, parent_id, path, created, updated',
        'FROM forums JOIN forums_access ON forums_access.forum_id=forums.id WHERE id=$forum_id AND forums_access.user=$user_id'
    ].join(' '),
    oneResult: true
});

Forum.insert = function (forum, user, callback) {
    var db = this.getDB();
    db.query("SELECT create_forum($forum, $user) AS id", {forum: forum, user: user}, function (err, results) {
        if (err || results.rows.length == 0) {
            return callback(err);
        } else {
            forum.id = results.rows[0].id;
            return callback(err, results.rows[0].id);
        }
    });
};

Forum.registerFactorySQL({
    name: 'update',
    sql: [
        'SELECT * from update_forum($forum, $user_id)'
    ].join(' '),
    oneResult: true
});

Forum.registerFactorySQL({
    name: 'getForum',
    sql: [
        "SELECT id, owner, name, description, created, updated, path, (SELECT json_agg(row_to_json(f_rows)) as forums",
        "FROM (select id, owner, name, description, created, updated, path FROM forums AS forum_children",
        "WHERE forum_parent.id=forum_children.parent_id) f_rows) as forums",
        "FROM forums as forum_parent",
        "LEFT JOIN forums_access ON forums_access.forum_id=forum_parent.id AND forums_access.user_id=$user_id",
        "WHERE forum_parent.id=$forum_id AND (forums_access.read=True OR forum_parent.owner=$user_id)"
    ].join(' '),
    oneResult: true
});

Forum.registerFactorySQL({
    name: 'delete',
    sql: "DELETE FROM forums WHERE id=$arg",
    oneArg: true,
    oneResult: true
});

var ForumPage = new gatepost.Model({
    results: {collection: 'forum'},
    count: {type: 'integer'},
    total: {type: 'integer'}
});

ForumPage.registerFactorySQL({
    name: "all",
    sql: [
        "SELECT (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname='forums') AS total,",
        "json_agg(row_to_json(forum_rows)) as results,",
        "count(forum_rows.*) as count",
        'FROM (SELECT id, owner, name, description, parent_id, path, created, updated',
        'FROM forums',
        'LEFT JOIN forums_access ON forums_access.forum_id=forums.id AND forums_access.user_id=$user_id',
        'WHERE forums_access.read=True OR forums.owner=$user_id',
        'ORDER BY id LIMIT $limit OFFSET $offset) forum_rows'
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    },
    oneResult: true
});

Forum.all = ForumPage.all;

module.exports = Forum;
