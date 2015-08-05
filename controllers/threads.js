var Thread = require('../models/thread')
var joi = require('joi');
var lodash = require('lodash');

module.exports = {
    get: {
        handler: function (request, reply) {
            Thread.get({thread_id: request.params.thread_id, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'token',
        validate: {
            params: {
                thread_id: joi.number().integer().required()
            }
        }
    },

    list: {
        handler: function (request, reply) {
            var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
            Thread.all(params, reply);
        },
        auth: 'token',
        validate: {
            query: {
                limit: joi.number().integer(),
                offset: joi.number().integer()
            }
        }
    },

    listByForum: {
        handler: function (request, reply) {
            var params = lodash.assign(request.query, request.params, {user_id: request.auth.credentials.user});
            Thread.allByForum(params, reply);
        },
        auth: 'token',
        validate: {
            params: {
                forum_id: joi.number().integer().required()
            },
            query: {
                limit: joi.number().integer(),
                offset: joi.number().integer()
            }
        }
    },

    create: {
        handler: function (request, reply) {
            var thread = Thread.create(request.payload);
            Thread.insert(thread, request.auth.credentials.user, function (err) {
                return reply(err, thread).code(201);
            });
        },
        auth: 'token',
        validate: {
            payload: Thread.exportJoi(['forum_id', 'subject', 'open', 'locked', 'tags']).requiredKeys(['forum_id', 'subject'])
        }
    },

    update: {
        handler: function (request, reply) {
            Thread.update(request.params.thread_id, request.payload, reply);
        },
        auth: 'token',
        validate: {
            params: {
                thread_id: joi.number().integer().required()
            },
            payload: Thread.exportJoi(['forum_id', 'subject', 'open', 'locked', 'tags'])
        }
    },

    delete: {
        handler: function (request, reply) {
            if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
                throw Boom.unauthorized();
            }
            Thread.delete(request.params.thread_id, reply);
        },
        auth: 'token',
        validate: {
            params: {
                thread_id: joi.number().integer()
            }
        }
    }
}
