var models = {
    Forums: require('../models/forum')
};
var BoomPg = require('../../internal-api/controllers/boom_postgres');
var joi = require('joi');
var lodash = require('lodash');

var ForumsController = {};
module.exports = ForumsController;

ForumsController.get = {
    handler: function (request, reply) {
        models.Forums.getForum({forum_id: request.params.forum_id, user_id: request.auth.credentials.user}, function (err, forum) {
            return reply(BoomPg(err, forum, true), forum);
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            forum_id: joi.number().integer()
        }
    }
};

ForumsController.list = {
    handler: function (request, reply) {
        var params = request.query;
        params.user_id = request.auth.credentials.user;
        models.Forums.all(params, function (err, forum) {
            return reply(BoomPg(err), forum);
        });
    },
    auth: 'gateway',
    validate: {
        query: {
            offset: joi.number().integer(),
            limit: joi.number().integer()
        }
    }
};

ForumsController.getTree = {
    handler: function (request, reply) {
        models.Forums.getTree(function (err, forum) {
            return reply(BoomPg(err, forum, true), forum);
        });
    },
    auth: 'gateway'
};

ForumsController.create = {
    handler: function (request, reply) {
        var forum = models.Forums.create(request.payload).toJSON();
        models.Forums.insert(forum, request.auth.credentials.user, function (err) {
            return reply(BoomPg(err, forum, true), forum).code(201);
        });

    },
    auth: 'gateway',
    validate: {
        payload: models.Forums.exportJoi(['name', 'description', 'parent_id']).requiredKeys(['name'])
    }
};

ForumsController.update = {
    handler: function (request, reply) {
        var payload = models.Forums.create(request.payload).toJSON();
        payload.id = request.params.forum_id;
        models.Forums.update({forum: payload, user_id: request.auth.credentials.user}, function (err, forum) {
            return reply(BoomPg(err), forum);
        });

    },
    auth: 'gateway',
    validate: {
        payload: models.Forums.exportJoi(['owner', 'name', 'description', 'parent_id']),
        params: {
            forum_id: joi.number().integer()
        }
    }
};

ForumsController.delete = {
    handler: function (request, reply) {
        if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
            return reply(Boom.unauthorized());
        }
        models.Forums.delete(request.params.forum_id, function (err) {
            return reply(BoomPg(err));
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            forum_id: joi.number().integer()
        }
    }
};
