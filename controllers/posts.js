var models = {
    Post: require('../models/post')
};

var BoomPg = require('../../internal-api/controllers/boom_postgres');
var joi = require('joi');
var lodash = require('lodash');

var PostsController = module.exports = {};

PostsController.get = {
    handler: function (request, reply) {
        models.Post.get({post_id: request.params.post_id, user_id: request.auth.credentials.user}, function (err, post) {
            return reply(BoomPg(err, post, true), post);
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            post_id: joi.number().integer().required()
        }
    }
};

PostsController.list = {
    handler: function (request, reply) {
        var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
        models.Post.all(params, function (err, result) {
            return reply(BoomPg(err), result);
        });
    },
    auth: 'gateway',
    validate: {
        query: {
            limit: joi.number().integer(),
            offset: joi.number().integer()
        }
    }
};

PostsController.listByThread = {
    handler: function (request, reply) {
        var params = lodash.assign(request.query, request.params, {user_id: request.auth.credentials.user});
        models.Post.allByThread(params, function (err, result) {
            return reply(BoomPg(err), result);
        });
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
};

PostsController.create = {
    handler: function (request, reply) {
        var post = models.Post.create(request.payload);
        models.Post.insert(post, request.auth.credentials.user, function (err) {
            return reply(BoomPg(err), post).code(201);
        });
    },
    auth: 'gateway',
    validate: {
        payload: models.Post.exportJoi(['body', 'parent_id', 'thread_id']).requiredKeys(['body'])
    }
};

PostsController.update = {
    handler: function (request, reply) {
        var post = models.Post.create(request.payload);
        models.Post.update({post: post, user_id: request.auth.credentials.user}, function (err, post) {
            return reply(BoomPg(err, post, true), post);
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            post_id: joi.number().integer().required()
        },
        payload: models.Post.exportJoi(['body'])
    }
};

PostsController.delete = {
    handler: function (request, reply) {
        var post = models.Post.create({id: request.params.post_id, body: '[deleted]', author: '[deleted]'});
        models.Post.update({post: post, user_id: request.auth.credentials.user}, function (err) {
            return reply(BoomPg(err));
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            post_id: joi.number().integer()
        }
    }
};
