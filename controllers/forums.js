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
            err = BoomPg(err, forum, true);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading forum: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum);
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            forum_id: joi.string()
        }
    }
};

ForumsController.list = {
    handler: function (request, reply) {
        var params = request.query;
        params.user_id = request.auth.credentials.user;
        models.Forums.all(params, function (err, forum) {
            err = BoomPg(err);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading forum: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum);
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
            err = BoomPg(err, forum, true);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading forum: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum.toJSON());
        });
    },
    auth: 'gateway',
    validate: {
    }
};

ForumsController.create = {
    handler: function (request, reply) {
        var forum = models.Forums.create(request.payload).toJSON();
        models.Forums.insert(forum, request.auth.credentials.user, function (err) {
            err = BoomPg(err, forum, true);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading user: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum).code(201);
        });

    },
    auth: 'gateway',
    validate: {
        payload: models.Forums.exportJoi(['owner', 'name','description', 'parent_id'])
    }
};

ForumsController.update = {
    handler: function (request, reply) {
        var payload = models.Forums.create(request.payload).toJSON();
        payload.id = request.params.forum_id;
        models.Forums.update({forum: payload, user_id: request.auth.credentials.user}, function (err, forum) {
            err = BoomPg(err);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem loading user: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'loaded: ' + request.params.forum_id);
            return reply(forum.toJSON());
        });

    },
    auth: 'gateway',
    validate: {
    }
};

ForumsController.delete = {
    handler: function (request, reply) {
        if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
            return reply(Boom.unauthorized());
        }
        models.Forums.delete(request.params.forum_id, function (err) {
            err = BoomPg(err);
            if (err) {
                request.log(['forum', 'get', 'error'], 'problem deleting forum: ' + request.params.forum_id);
                return reply(err);
            }
            request.log(['forum', 'get'], 'deleted: ' + request.params.forum_id);
            return reply();
        });
    },
    auth: 'gateway',
    validate: {
        params: {
            forum_id: joi.string()
        }
    }
};
