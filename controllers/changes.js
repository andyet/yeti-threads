'use strict';

var joi = require('joi');
var lodash = require('lodash');

module.exports = (models) => {
  return {
    listByDateAndUser: {
      handler: function (request, reply) {
        var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
        reply(this.Change.getByDateAndUser(params));
      },
      auth: 'token',
      validate: {
        query: {
          limit: joi.number().integer().min(1),
          offset: joi.number().integer().min(0),
          when: joi.date().required()
        }
      }
    }
  };
};
