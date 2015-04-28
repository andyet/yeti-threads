var models = {
    Thread: require('../models/thread')
};

var BoomPg = require('../../internal-api/controllers/boom_postgres');
var joi = require('joi');
var lodash = require('lodash');

var ThreadsController = module.exports = {};

ThreadsController.get = {
    handler: function (request, reply) {
        models.Thread.get(request.params.thread_id, function (err, thread) {
            err = BoomPg(err, thread, true);
            if (err) {
                request.log(['thread', 'get', 'error'], 'problem loading thread: ' + request.params.thread_id);
                return reply(err);
            }
            request.log(['thread', 'get'], 'loaded: ' + request.params.thread_id);
            return reply(thread);
        });
    },
    validate: {
        params: {
            thread_id: joi.string()
        }
    }
};

ThreadsController.list = {
    handler: function (request, reply) {
        models.Thread.all(request.query, function (err, result) {
            err = BoomPg(err);
            if (err) {
                request.log(['thread', 'get', 'error'], 'problem loading threads: ' + request.query);
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

ThreadsController.listByForum = {
    handler: function (request, reply) {
        var params = lodash.assign(request.query, request.params);
        models.Thread.allByForum(params, function (err, result) {
            err = BoomPg(err);
            if (err) {
                request.log(['thread', 'get', 'error'], 'problem loading threads: ' + request.query);
                return reply(err);
            }
            return reply(result);
        });
    },
    validate: {
        params: {
            forum_id: joi.string()
        },
        query: {
            limit: joi.number().integer(),
            offset: joi.number().integer()
        }
    }
};

ThreadsController.create = {
    handler: function (request, reply) {
        var thread = models.Thread.create(request.params);
        thread.insert(function (err) {
            err = BoomPg(err);
            if (err) {
                request.log(['thread', 'post', 'error'], 'problem creating thread');
                return reply(err);
            }
            request.log(['thread', 'post'], 'created: ' + thread.id);
            return reply(thread).code(201);
        });
    },
    validate: {
    }
};

ThreadsController.update = {
    handler: function (request, reply) {
        models.Thread.update(request.params.thread_id, request.payload, function (err, thread) {
            err = BoomPg(err, thread, true);
            if (err) {
                request.log(['thread', 'put', 'error'], 'problem updating thread');
                return reply(err);
            }
            request.log(['thread', 'put'], 'updated: ' + thread.id);
            return reply(thread);
        });
    },
    validate: {
        params: {
            thread_id: joi.number().integer()
        }
    }
};

ThreadsController.delete = {
    handler: function (request, reply) {
        models.Thread.delete(request.params.thread_id, function (err) {
            err = BoomPg(err);
            if (err) {
                request.log(['thread', 'delete', 'error'], 'problem deleting thread: ' + request.params.thread_id);
                return reply(err);
            }
            request.log(['delete', 'get'], 'deleted: ' + request.params.thread_id);
            return reply();
        });
    },
    validate: {
        params: {
            thread_id: joi.string()
        }
    }
};
