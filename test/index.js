/* jshint expr: true */
var config = require('getconfig');
var gatepost = require('gatepost');
var pg = require('pg');
var lab = exports.lab = require('lab').script();
var Hapi = require('hapi');
var util = require('util');
var code = require('code');

var client = new pg.Client(config.db);
gatepost.registerPG(client);
client.connect();

var server;

lab.experiment('forums', function () {
    var forum;
    lab.before(function (done) {
        server = new Hapi.Server();
        server.connection(config.server);

        server.register([
            {
                register: require('platform-gateway-auth')
            },
            {
                register: require('../'),
            },
        ], function (err) {
            if (err) {
                throw err;
            }
            done();
        });
    });

    lab.test('can create forum', function (done) {
        server.inject({
            method: 'post',
            url: '/forums',
            payload: JSON.stringify({
                name: 'test1',
                owner: 'bill',
                description: 'best forum ever 1'
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            console.log(res.payload);
            forum = JSON.parse(res.payload);
            console.log(forum.id);
            code.expect(forum.name).to.equal('test1');
            done();
        });
    });
    
    lab.test('can update forum', function (done) {
        server.inject({
            method: 'put',
            url: '/forums/' + forum.id,
            payload: JSON.stringify({
                name: 'test2',
            }),
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            var pl = JSON.parse(res.payload);
            code.expect(pl.name).to.equal('test2');
            done();
        });
    });

    lab.test('can delete forum', function (done) {
        server.inject({
            method: 'delete',
            url: '/forums/' + forum.id,
            headers: {
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});
