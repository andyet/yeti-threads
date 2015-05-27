var Change = require('../models/change');
var joi = require('joi');
var lodash = require('lodash');

module.exports = {
    listByDateAndUser: {
        handler: function (request, reply) {
            var params = lodash.assign(request.query, {user_id: request.auth.credentials.user});
            Change.getByDateAndUser(params, reply);
        },
        auth: 'gateway',
        validate: {
            query: {
                limit: joi.number().integer().min(1),
                offset: joi.number().integer().min(0),
                when: joi.date().required()
            }
        }
    }
};
