var Access = require('../models/access');
var joi = require('joi');
var lodash = require('lodash');
var Boom = require('boom');

module.exports = {
    get: {
        handler: function (request, reply) {
            if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
                return reply(Boom.unauthorized());
            }
            Access.get({forum_id: request.params.forum_id, user_id: request.credentials.user}, reply);
        },
        auth: 'gateway',
        validate: {
        }
    },

    update: {
        handler: function (request, reply) {
            if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
                return reply(Boom.unauthorized());
            }
            var payload = lodash.assign(request.payload, request.params);
            Access.update(request.payload, reply);
        },
        auth: 'gateway',
        validate: {
        }
    },

    create: {
        handler: function (request, reply) {
            if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
                return reply(Boom.unauthorized());
            }
            var payload = lodash.assign(request.payload, request.params);
            Access.insert(request.payload, function (err) {
                return reply(err).code(201);
            });
        },
        auth: 'gateway',
        validate: {
        }
    }
}
