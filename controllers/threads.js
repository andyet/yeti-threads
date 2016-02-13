var joi = require('joi');
var lodash = require('lodash');

module.exports = (models) => {
  return {
    get: {
      handler: function (request, reply) {
        reply(this.Thread.get({thread_id: request.params.thread_id, user_id: request.auth.credentials.user}));
      },
      auth: 'token',
      validate: {
        params: {
          thread_id: joi.number().integer().required()
        }
      }
    },

    list: {
      handler: function (request, reply) {
        var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
        reply(this.Thread.all(params));
      },
      auth: 'token',
      validate: {
        query: {
          limit: joi.number().integer(),
          offset: joi.number().integer()
        }
      }
    },

    listByForum: {
      handler: function (request, reply) {
        var params = lodash.assign(request.query, request.params, {user_id: request.auth.credentials.user});
        reply(this.Thread.allByForum(params));
      },
      auth: 'token',
      validate: {
        params: {
          forum_id: joi.number().integer().required()
        },
        query: {
          limit: joi.number().integer(),
          offset: joi.number().integer()
        }
      }
    },

    create: {
      handler: function (request, reply) {
        var thread = this.Thread.create(request.payload);
        thread.insert({user: request.auth.credentials.user})
        .then((thread) => {
          reply(thread).code(201);
        }).catch(reply);
      },
      auth: 'token',
      validate: {
        payload: models.Thread.exportJoi(['forum_id', 'subject', 'open', 'locked', 'tags']).requiredKeys(['forum_id', 'subject'])
      }
    },

    update: {
      handler: function (request, reply) {
        var thread = this.Thread.create(request.payload);
        thread.id = request.params.thread_id;
        reply(this.Thread.update({user: request.auth.credentials.user}));
      },
      auth: 'token',
      validate: {
        params: {
          thread_id: joi.number().integer().required()
        },
        payload: models.Thread.exportJoi(['forum_id', 'subject', 'open', 'locked', 'tags'])
      }
    },

    delete: {
      handler: function (request, reply) {
        if (request.auth.credentials.scope.indexOf('forum_admin') === -1) {
          throw Boom.unauthorized();
        }
        reply(this.Thread.delete({id: request.params.thread_id, user: request.auth.credentials.user}));
      },
      auth: 'token',
      validate: {
        params: {
          thread_id: joi.number().integer()
        }
      }
    }
  };
};
