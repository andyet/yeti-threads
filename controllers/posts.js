var models = {
    Post: require('../models/post')
};

var BoomPg = require('../../internal-api/controllers/boom_postgres');
var joi = require('joi');
var lodash = require('lodash');

var PostsController = module.exports = {};

PostsController.get = {
    handler: function (request, reply) {
        models.Post.get(request.params.post_id, function (err, post) {
            err = BoomPg(err, post, true);
            if (err) {
                request.log(['post', 'get', 'error'], 'problem loading post: ' + request.params.post_id);
                return reply(err);
            }
            request.log(['post', 'get'], 'loaded: ' + request.params.post_id);
            return reply(post);
        });
    },
    validate: {
        params: {
            post_id: joi.string()
        }
    }
};

PostsController.list = {
    handler: function (request, reply) {
        models.Post.all(request.query, function (err, result) {
            err = BoomPg(err);
            if (err) {
                request.log(['post', 'get', 'error'], 'problem loading posts: ' + request.query);
                return reply(err);
            }
            return reply(result);
        });
    },
    validate: {
        query: {
            limit: joi.number().integer(),
            offset: joi.number().integer()
        }
    }
};

PostsController.listByThread = {
    handler: function (request, reply) {
        var params = lodash.assign(request.query, request.params);
        models.Post.allByThread(params, function (err, result) {
            err = BoomPg(err);
            if (err) {
                request.log(['post', 'get', 'error'], 'problem loading posts: ' + request.query);
                return reply(err);
            }
            return reply(result);
        });
    },
    validate: {
        params: {
            thread_id: joi.string()
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
        post.insert(function (err) {
            err = BoomPg(err);
            if (err) {
                request.log(['post', 'post', 'error'], 'problem creating post');
                return reply(err);
            }
            request.log(['post', 'post'], 'created: ' + post.id);
            return reply(post).code(201);
        });
    },
    validate: {
    }
};

PostsController.update = {
    handler: function (request, reply) {
        models.Post.update(request.params.post_id, request.payload, function (err, post) {
            err = BoomPg(err, post, true);
            if (err) {
                request.log(['post', 'put', 'error'], 'problem updating post');
                return reply(err);
            }
            request.log(['post', 'put'], 'updated: ' + post.id);
            return reply(post);
        });
    },
    validate: {
        params: {
            post_id: joi.number().integer()
        }
    }
};

PostsController.delete = {
    handler: function (request, reply) {
        models.Post.delete(request.params.post_id, function (err) {
            err = BoomPg(err);
            if (err) {
                request.log(['post', 'delete', 'error'], 'problem deleting post: ' + request.params.post_id);
                return reply(err);
            }
            request.log(['post', 'delete'], 'deleted: ' + request.params.post_id);
            return reply();
        });
    },
    validate: {
        params: {
            post_id: joi.string()
        }
    }
};
