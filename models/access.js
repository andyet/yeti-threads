var gatepost = require('gatepost');

var Access = new gatepost.Model({
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
    sql: [
        "SELECT user_id, forum_id, read, write, post FROM access WHERE user_id=$user_id AND forum_id=$forum_id"
    ].join(' '),
    oneResult: true
});

var AccessPage = new gatepost.Model({
    count: {type: 'integer'},
    total: {type: 'integer'},
    results: {collection: Access}
});

AccessPage.registerFactorySQL({
    name: "list",
    sql: [
        "SELECT user_id, forum_id, read, write, post FROM access LIMIT $limit OFFSET $offset ORDER BY user_id, forum_id"
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    }
});

AccessPage.registerFactorySQL({
    name: "listByUser",
    sql: [
        "SELECT user_id, forum_id, read, write FROM access WHERE user_id=$user_id LIMIT $limit OFFSET $offset ORDER BY forum_id"
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    }
});

AccessPage.registerFactorySQL({
    name: "listByForum",
    sql: [
        "SELECT user_id, forum_id, read, write FROM access WHERE forum_id=$forum_id LIMIT $limit OFFSET $offset ORDER BY user_id"
    ].join(' '),
    defaults: {
        limit: 20,
        offset: 0
    }
});

Access.list = AccessPage.list;

Access.insert = function (data, callback) {
    var db = this.getDB();
    db.query("INSERT INTO forums_access (user_id, forum_id, read, write, post) VALUES ($user_id, $forum_id, $read, $write, $post)", data, function (err, result) {
        callback(err);
    });
};

Access.update = function (data, callback) {
    var db = this.getDB();
    db.query("UPDATE forums_access SET read=$read, write=$write, post=$post WHERE user_id=$user_id, forum_id=$forum_id", function (err, result) {
        callback(err);
    });
};

module.exports = Access;
