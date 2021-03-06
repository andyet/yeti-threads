'use strict';

var joi = require('joi');
var lodash = require('lodash');
var Boom = require('boom');

module.exports = (models) => {
  return {
    get: {
      handler: function (request, reply) {
        reply(this.Access.get({forum_id: request.params.forum_id, user_id: request.params.user_id}));
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
        var access = this.Access.create(payload);
        reply(access.update());
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
        payload: models.Access.exportJoi(['read', 'write', 'post'])
      }
    },

    create: {
      handler: function (request, reply) {
        var payload = lodash.assign(request.payload, request.params);
        var access = this.Access.create(request.payload);
        access.insert({})
        .then((err) => {
          reply().code(201);
        })
        .catch(reply);
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
        payload: models.Access.exportJoi(['read', 'write', 'post'])
      }
    }
  };
};
