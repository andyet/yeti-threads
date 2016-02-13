'use strict';

var config = require('getconfig');
var Boom = require('boom');
var hapi = require('hapi');
var server = new hapi.Server();
server.connection(config.server);

var gatepost = require('gatepost')(config.db);

var events = require('./events')(gatepost.getClient(), server);

var plugins = [
  {
    register: require('hapi-auth-jwt'),
    options: {}
  }, {
    register: require('good'),
    options: {
      reporters: [
        {
          reporter: require('good-console'),
          events: {log: '*', response: '*'}
        }
      ]
    }
  }, {
    register: require('./'),
    options: {
      jwtKey: config.jwtKey,
      gatepost
    }
  },
  {
    register: require('drboom'),
    options: {
      plugins: [
          require('drboom-pg')({}),
          require('drboom-gatepost')({Boom: Boom, Gatepost: gatepost}),
          require('drboom-joi')({Boom})
      ]
    }
  }
];


// Add development only plugins
if (config.isDev) {
  plugins.push({
    register: require('lout'),
    options: {}
  });
}

server.register(plugins, function (err) {
  if (err) {
    server.log(['error'], 'Failed to require plugins');
    server.log(['error'], err.message);
    throw err;
  }
  server.log(['startup'], 'Loaded forum plugins');

    server.start(function (err) {
      if (err) {
        server.log(['error'], 'Failed to start forum server');
        server.log(['error'], err.message);
        throw err;
      }

      server.log(['info', 'startup'], 'Server is running on: ' + server.info.uri);
    });
});
