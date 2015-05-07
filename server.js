var config = require('getconfig');
var hapi = require('hapi');
var gatepost = require('gatepost');
var pg = require('pg');

var server = new hapi.Server();
server.connection(config.server);
var client = new pg.Client(config.db);
gatepost.registerPG(client);

var plugins = [
    {
        register: require('platform-gateway-auth'),
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
        options: {}
    },
    {
        register: require('pgboom'), 
        options: {
            getNull404: true
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

    client.connect(function (dberr) {
        server.start(function (err) {
            if (dberr || err) {
                server.log(['error'], 'Failed to start forum server');
                server.log(['error'], dberr || err.message);
                throw err;
            }

            server.log(['info', 'startup'], 'Server is running on: ' + server.info.uri);
        });
    });
});
