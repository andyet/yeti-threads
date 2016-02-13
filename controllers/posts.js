var joi = require('joi');
var lodash = require('lodash');

module.exports = (models) => {
  return {
    get: {
      handler: function (request, reply) {
        reply(this.Post.get({post_id: request.params.post_id, user_id: request.auth.credentials.user}));
      },
      auth: 'token',
      validate: {
        params: {
          post_id: joi.number().integer().required()
        }
      }
    },

    list: {
      handler: function (request, reply) {
        var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
        reply(this.Post.all(params));
      },
      auth: 'token',
      validate: {
        query: {
          limit: joi.number().integer(),
          offset: joi.number().integer()
        }
      }
    },

    listByThread: {
      handler: function (request, reply) {
        var params = lodash.assign(request.query, request.params, {user_id: request.auth.credentials.user});
        reply(this.Post.allByThread(params));
      },
      auth: 'token',
      validate: {
        params: {
          thread_id: joi.number().integer().required()
        },
        query: {
          limit: joi.number().integer(),
          offset: joi.number().integer()
        }
      }
    },

    create: {
      handler: function (request, reply) {
        var post = this.Post.create(request.payload);
        post.insert({user: request.auth.credentials.user})
        .then((post) => {
          reply(post).code(201);
        }).catch((err) => {
          console.log(err);
          reply(err);
        });
      },
      auth: 'token',
      validate: {
        payload: models.Post.exportJoi(['body', 'parent_id', 'thread_id']).requiredKeys(['body'])
      }
    },

    update: {
      handler: function (request, reply) {
        var post = this.Post.create(request.payload);
        reply(post.update({user_id: request.auth.credentials.user}));
      },
      auth: 'token',
      validate: {
        params: {
          post_id: joi.number().integer().required()
        },
        payload: models.Post.exportJoi(['body'])
      }
    },

    delete: {
      handler: function (request, reply) {
        var post = this.Post.create({id: request.params.post_id, body: '[deleted]', author: '[deleted]'});
        reply(post.update({user: request.auth.credentials.user}));
      },
      auth: 'token',
      validate: {
        params: {
          post_id: joi.number().integer()
        }
      }
    }
  };
};
