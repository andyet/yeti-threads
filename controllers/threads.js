var models = {
    Thread: require('../models/thread')
};

var BoomPg = require('../../internal-api/controllers/boom_postgres');
var joi = require('joi');
var lodash = require('lodash');

var ThreadsController = module.exports = {};

ThreadsController.get = {
    handler: function (request, reply) {
        models.Thread.get({thread_id: request.params.thread_id, user_id: request.auth.credentials.user}, function (err, thread) {
            return reply(BoomPg(err, thread, true), thread);
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            thread_id: joi.number().integer().required()
        }
    }
};

ThreadsController.list = {
    handler: function (request, reply) {
        var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
        models.Thread.all(params, function (err, result) {
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

ThreadsController.listByForum = {
    handler: function (request, reply) {
        var params = lodash.assign(request.query, request.params, {user_id: request.auth.credentials.user});
        models.Thread.allByForum(params, function (err, result) {
            return reply(BoomPg(err), result);
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            forum_id: joi.number().integer().required()
        },
        query: {
            limit: joi.number().integer(),
            offset: joi.number().integer()
        }
    }
};

ThreadsController.create = {
    handler: function (request, reply) {
        var thread = models.Thread.create(request.payload);
        models.Thread.insert(thread, request.auth.credentials.user, function (err) {
            return reply(BoomPg(err), thread).code(201);
        });
    },
    auth: 'gateway',
    validate: {
        payload: models.Thread.exportJoi(['forum_id', 'subject', 'open', 'locked', 'tags']).requiredKeys(['forum_id', 'subject'])
    }
};

ThreadsController.update = {
    handler: function (request, reply) {
        models.Thread.update(request.params.thread_id, request.payload, function (err, thread) {
            return reply(BoomPg(err, thread, true), thread);
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            thread_id: joi.number().integer().required()
        },
        payload: models.Thread.exportJoi(['forum_id', 'subject', 'open', 'locked', 'tags'])
    }
};

ThreadsController.delete = {
    handler: function (request, reply) {
        if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
            return reply(Boom.unauthorized());
        }
        models.Thread.delete(request.params.thread_id, function (err) {
            return reply(BoomPg(err));
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            thread_id: joi.number().integer()
        }
    }
};
