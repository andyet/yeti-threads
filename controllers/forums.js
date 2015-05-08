var Forum = require('../models/forum')
var joi = require('joi');
var lodash = require('lodash');

module.exports = {
    get: {
        handler: function (request, reply) {
            Forum.getForum({forum_id: request.params.forum_id, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'gateway',
        validate: {
            params: {
                forum_id: joi.number().integer()
            }
        }
    },

    list: {
        handler: function (request, reply) {
            var params = request.query;
            params.user_id = request.auth.credentials.user;
            Forum.all(params, reply);
        },
        auth: 'gateway',
        validate: {
            query: {
                offset: joi.number().integer(),
                limit: joi.number().integer()
            }
        }
    },

    getTree: {
        handler: function (request, reply) {
            Forum.getTree(reply);
        },
        auth: 'gateway'
    },

    create: {
        handler: function (request, reply) {
            var forum = Forum.create(request.payload).toJSON();
            Forum.insert(forum, request.auth.credentials.user, function (err) {
                return reply(err, forum).code(201);
            });

        },
        auth: 'gateway',
        validate: {
            payload: Forum.exportJoi(['name', 'description', 'parent_id']).requiredKeys(['name'])
        }
    },

    update: {
        handler: function (request, reply) {
            var payload = Forum.create(request.payload).toJSON();
            payload.id = request.params.forum_id;
            Forum.update({forum: payload, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'gateway',
        validate: {
            payload: Forum.exportJoi(['owner', 'name', 'description', 'parent_id']),
            params: {
                forum_id: joi.number().integer()
            }
        }
    },

    delete: {
        handler: function (request, reply) {
            Forum.delete(request.params.forum_id, reply);
        },
        auth: {
            scope: 'forum_admin',
            strategy: 'gateway'
        },
        validate: {
            params: {
                forum_id: joi.number().integer()
            }
        }
    }
};
