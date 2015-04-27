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
        models.Forums.getForum(request.params.forum_id, function (err, forum) {
            err = BoomPg(err, forum, true);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading forum: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum.toJSON());
        });
    },
    validate: {
        params: {
            forum_id: joi.string()
        }
    }
};

ForumsController.getTree = {
    handler: function (request, reply) {
        models.Forums.getTree(function (err, forum) {
            err = BoomPg(err, forum, true);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading forum: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum.toJSON());
        });
    },
    validate: {
    }
};

ForumsController.create = {
    handler: function (request, reply) {
        var forum = models.Forums.create(request.payload);
        forum.insert(request.payload, function (err) {
            err = BoomPg(err, forum, true);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading user: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum.toJSON()).code(201);
        });

    },
    validate: {
    }
};

ForumsController.update = {
    handler: function (request, reply) {
        models.Forums.update(request.params.forum_id, request.payload, function (err, forum) {
            err = BoomPg(err, forum, true);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading user: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum.toJSON());
        });

    },
    validate: {
    }
};
