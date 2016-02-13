'use strict';

const SQL = require('sql-template-strings');
const joi = require('joi');
const util = require('util');

module.exports = function (gatepost) {

  const Change = new gatepost.Model({
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

  const Changelist = new gatepost.Model({
    results: {collection: 'change'},
    count: {type: 'integer'},
    total: {type: 'integer'}
  });

  Changelist.fromSQL({
    name: 'getByDateAndUser',
    sql: (args, model) => SQL`SELECT json_agg(row_to_json(logs)) AS results,
  COUNT(logs.*) AS "count",
  (SELECT count(distinct (forums_log.forum_id, forums_log.other_id, forums_log.tbl)) as total from forums_log JOIN forums_access ON forums_log.forum_id=forums_access.forum_id WHERE forums_access.user_id=${args.user_id} AND "time" >= ${args.when}) AS total
  FROM (SELECT DISTINCT ON (forums_log.forum_id, forums_log.other_id, forums_log.tbl) * FROM forums_log
  JOIN forums_access ON forums_log.forum_id=forums_access.forum_id
  WHERE forums_access.user_id=${args.user_id} AND "time" >= ${args.when}
  LIMIT ${args.limit} OFFSET ${args.offset}) logs`,
    defaults: {
      offset: 0,
      limit: 20
    },
    oneResult: true
  });

  Change.getByDateAndUser = Changelist.getByDateAndUser;

  return Change;
}

