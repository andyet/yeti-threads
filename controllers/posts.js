var Post = require('../models/post')
var joi = require('joi');
var lodash = require('lodash');

module.exports = {
    get: {
        handler: function (request, reply) {
            Post.get({post_id: request.params.post_id, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'gateway',
        validate: {
            params: {
                post_id: joi.number().integer().required()
            }
        }
    },

    list: {
        handler: function (request, reply) {
            var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
            Post.all(params, reply);
        },
        auth: 'gateway',
        validate: {
            query: {
                limit: joi.number().integer(),
                offset: joi.number().integer()
            }
        }
    },

    listByThread: {
        handler: function (request, reply) {
            var params = lodash.assign(request.query, request.params, {user_id: request.auth.credentials.user});
            Post.allByThread(params, reply);
        },
        auth: 'gateway',
        validate: {
            params: {
                thread_id: joi.number().integer().required()
            },
            query: {
                limit: joi.number().integer(),
                offset: joi.number().integer()
            }
        }
    },

    create: {
        handler: function (request, reply) {
            var post = Post.create(request.payload);
            Post.insert(post, request.auth.credentials.user, function (err) {
                return reply(err, post).code(201);
            });
        },
        auth: 'gateway',
        validate: {
            payload: Post.exportJoi(['body', 'parent_id', 'thread_id']).requiredKeys(['body'])
        }
    },

    update: {
        handler: function (request, reply) {
            var post = Post.create(request.payload);
            Post.update({post: post, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'gateway',
        validate: {
            params: {
                post_id: joi.number().integer().required()
            },
            payload: Post.exportJoi(['body'])
        }
    },

    delete: {
        handler: function (request, reply) {
            var post = Post.create({id: request.params.post_id, body: '[deleted]', author: '[deleted]'});
            Post.update({post: post, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'gateway',
        validate: {
            params: {
                post_id: joi.number().integer()
            }
        }
    }
}
