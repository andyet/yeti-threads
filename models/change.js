var gatepost = require('gatepost');
var joi = require('joi');
var util = require('util');

//{"forum_id" : 67, "url_path" : "/forums/67", "table" : "forums", "other_id" : null, "type" : "INSERT", "when" : "2015-05-26T10:44:46.830204-07:00"}
var Change = new gatepost.Model({
    forum_id: {validate: joi.number().integer().min(0)},
    url_path: {
        derive: function () {
            return util.format('/%s/%d', this.table, this.other_id || this.forum_id);
        },
        validate: joi.string().max(50)
    },
    tbl: {
        alias: 'table',
        validate: joi.any().valid('forums', 'threads', 'posts', 'access')
    },
    other_id: {
        validate: joi.number().integer().min(0)
    },
    time: {
        alias: 'when',
        validate: joi.date()
    }
}, {
    name: 'change',
    toJSONUseAliases: true,
    cache: true
});

Changelist = new gatepost.Model({
    results: {collection: 'change'},
    count: {type: 'integer'},
    total: {type: 'integer'}
});

Changelist.fromSQL({
    name: 'getByDateAndUser',
    sql: [
        'SELECT json_agg(row_to_json(logs)) AS results,',
        'COUNT(logs.*) AS "count",',
        '(SELECT count(distinct (forums_log.forum_id, forums_log.other_id)) as total from forums_log JOIN forums_access ON forums_log.forum_id=forums_access.forum_id WHERE forums_access.user_id=$user_id AND "time" >= $when) AS total', 
        'FROM (SELECT DISTINCT ON (forums_log.forum_id, forums_log.other_id) * FROM forums_log',
        'JOIN forums_access ON forums_log.forum_id=forums_access.forum_id',
        'WHERE forums_access.user_id=$user_id AND "time" >= $when',
        'LIMIT $limit OFFSET $offset) logs'
    ].join(' '),
    defaults: {
        offset: 0,
        limit: 20
    },
    oneResult: true
});

Change.getByDateAndUser = Changelist.getByDateAndUser;

module.exports = Change;
