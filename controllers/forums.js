var Forum = require('../models/forum')
var joi = require('joi');
var lodash = require('lodash');

module.exports = {
    get: {
        handler: function (request, reply) {
            Forum.getForum({forum_id: request.params.forum_id, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'token',
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
        auth: 'token',
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
        auth: 'token'
    },

    create: {
        handler: function (request, reply) {
            var forum = Forum.create(request.payload).toJSON();
            Forum.insert(forum, request.auth.credentials.user, function (err) {
                return reply(err, forum).code(201);
            });

        },
        auth: 'token',
        validate: {
            payload: Forum.exportJoi(['name', 'description', 'parent_id']).requiredKeys(['name'])
        }
    },

    update: {
        handler: function (request, reply) {
            var forum = Forum.create(request.payload);
            forum.id = request.params.forum_id;
            forum.update({user_id: request.auth.credentials.user}, reply);
        },
        auth: 'token',
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
            strategy: 'token'
        },
        validate: {
            params: {
                forum_id: joi.number().integer()
            }
        }
    }
};
