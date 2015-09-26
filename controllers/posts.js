var Post = require('../models/post')
var joi = require('joi');
var lodash = require('lodash');

module.exports = {
    get: {
        handler: function (request, reply) {
            Post.get({post_id: request.params.post_id, user_id: request.auth.credentials.user}, reply);
        },
        auth: 'token',
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
        auth: 'token',
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
        auth: 'token',
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
            post.insert({user: request.auth.credentials.user}, function (err, post) {
                return reply(err, post).code(201);
            });
        },
        auth: 'token',
        validate: {
            payload: Post.exportJoi(['body', 'parent_id', 'thread_id']).requiredKeys(['body'])
        }
    },

    update: {
        handler: function (request, reply) {
            var post = Post.create(request.payload);
            post.update({user_id: request.auth.credentials.user}, reply);
        },
        auth: 'token',
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
            post.update({user: request.auth.credentials.user}, reply);
        },
        auth: 'token',
        validate: {
            params: {
                post_id: joi.number().integer()
            }
        }
    }
};
