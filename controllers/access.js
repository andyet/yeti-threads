var Access = require('../models/access');
var joi = require('joi');
var lodash = require('lodash');
var Boom = require('boom');

module.exports = {
    get: {
        handler: function (request, reply) {
            Access.get({forum_id: request.params.forum_id, user_id: request.params.user_id}, reply);
        },
        auth: {
            strategy: 'token',
            scope: 'forum_admin'
        },
        validate: {
            params: {
                forum_id: joi.number().integer().required(),
                user_id: joi.string().required()
            }
        }
    },

    update: {
        handler: function (request, reply) {
            var payload = lodash.assign(request.payload, request.params);
            var access = Access.create(payload);
            access.update(reply);
        },
        auth: {
            strategy: 'token',
            scope: 'forum_admin'
        },
        validate: {
            params: {
                forum_id: joi.number().integer().required(),
                user_id: joi.string().required()
            },
            payload: Access.exportJoi(['read', 'write', 'post'])
        }
    },

    create: {
        handler: function (request, reply) {
            var payload = lodash.assign(request.payload, request.params);
            var access = Access.create(request.payload);
            access.insert({}, function (err) {
                return reply(err).code(201);
            });
        },
        auth: {
            strategy: 'token',
            scope: 'forum_admin'
        },
        validate: {
            params: {
                forum_id: joi.number().integer().required(),
                user_id: joi.string().required()
            },
            payload: Access.exportJoi(['read', 'write', 'post'])
        }
    }
}
