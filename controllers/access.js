var Access = require('../models/access');
var BoomPg = require('../../internal-api/controllers/boom_postgres');
var joi = require('joi');
var lodash = require('lodash');

var AccessController = module.exports = {};

AccessController.get = {
    handler: function (request, reply) {
        Access.get({forum_id: request.params.forum_id, user_id: request.credentials.user}, function (err, access) {
            err = BoomPg(err, access, true);
            if (err) {
                request.log(['access', 'get', 'error'], 'problem loading access');
                return reply(err);
            }
            request.log(['access', 'get'], 'loaded access');
            return reply(access);
        });
    },
    auth: 'gateway',
    validate: {
    }
};

AccessController.update = {
    handler: function (request, reply) {
        var payload = lodash.assign(request.payload, request.params);
        Access.update(request.payload, function (err) {
            err = BoomPg(err);
            if (err) {
                request.log(['access', 'update', 'error'], 'problem updating access');
                return reply(err);
            }
            request.log(['access', 'update'], 'updated access');
            return reply();
        });
    },
    auth: 'gateway',
    validate: {
    }
};

AccessController.create = {
    handler: function (request, reply) {
        var payload = lodash.assign(request.payload, request.params);
        Access.insert(request.payload, function (err) {
            err = BoomPg(err);
            if (err) {
                request.log(['access', 'add', 'error'], 'problem adding access');
                return reply(err);
            }
            request.log(['access', 'add'], 'added access');
            return reply().code(201);
        });
    },
    auth: 'gateway',
    validate: {
    }
};
