'use strict';

var joi = require('joi');
var lodash = require('lodash');

module.exports = (models) => {
  return {
    get: {
      handler: function (request, reply) {
        reply(this.Forum.getForum({
          forum_id: request.params.forum_id,
          user_id: request.auth.credentials.user
        }));
      },
      auth: 'token',
      validate: {
        params: {
          forum_id: joi.number().integer()
        }
      }
    },

    list: {
      handler: function (request, reply) {
        var params = request.query;
        params.user_id = request.auth.credentials.user;
        reply(this.Forum.all(params));
      },
      auth: 'token',
      validate: {
        query: {
          offset: joi.number().integer(),
          limit: joi.number().integer()
        }
      }
    },

    getTree: {
      handler: function (request, reply) {
        reply(this.Forum.getTree());
      },
      auth: 'token'
    },

    create: {
      handler: function (request, reply) {
        var forum = this.Forum.create(request.payload);
        forum.insert({user: request.auth.credentials.user})
        .then((forum) => {
          reply(forum).code(201);
        });
      },
      auth: 'token',
      validate: {
        payload: models.Forum.exportJoi(['name', 'description', 'parent_id']).requiredKeys(['name'])
      }
    },

    update: {
      handler: function (request, reply) {
        var forum = this.Forum.create(request.payload);
        forum.id = request.params.forum_id;
        reply(forum.update({user: request.auth.credentials.user}));
      },
      auth: 'token',
      validate: {
        payload: models.Forum.exportJoi(['owner', 'name', 'description', 'parent_id']),
        params: {
          forum_id: joi.number().integer()
        }
      }
    },

    delete: {
      handler: function (request, reply) {
        reply(this.Forum.delete({forum_id: request.params.forum_id, user: request.auth.credentials.user}));
      },
      auth: {
        scope: 'forum_admin',
        strategy: 'token'
      },
      validate: {
        params: {
          forum_id: joi.number().integer()
        }
      }
    }
  };
};
