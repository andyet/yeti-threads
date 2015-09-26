/* jshint expr: true */
var config = require('getconfig');
var gatepost = require('gatepost');
var pg = require('pg');
var lab = exports.lab = require('lab').script();
var Hapi = require('hapi');
var util = require('util');
var code = require('code');
var jwt = require('jsonwebtoken');

config.jwtKey = require('crypto').randomBytes(48).toString('base64');
var token = jwt.sign({user: 'tester-user', scope: ['forum_admin']}, config.jwtKey, {expiresInMinutes: 15});
var authorization = 'Bearer ' + token;

gatepost.setConnection(config.db);
var start = null;

var server;

lab.experiment('forums', function () {
    var forum;
    lab.before(function (done) {
        gatepost.getClient((err, client, gpDone) => {
            client.query("LISTEN forums_log", function (err) {
                done();
            });

            client.on('notification', function (msg) {
                if (start === null) {
                    start = JSON.parse(msg.payload).when;
                }
            });
        });
    }),
    lab.before(function (done) {
        server = new Hapi.Server();
        server.connection(config.server);

        server.register([
            {
                register: require('hapi-auth-jwt')
            },
            {
                register: require('../'),
                options: {
                    jwtKey: config.jwtKey
                }
            },
            {
                register: require('pgboom'),
                options: { getNull404: true }
            }
        ], function (err) {
            if (err) {
                throw err;
            }
            done();
        });
    });
    lab.before(function (done) {
        server.inject({
            method: 'post',
            url: '/access/tester-user/forum/1',
            payload: JSON.stringify({
                write: true,
                read: true,
                post: true
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            done();
        });
    });

    lab.test('can create forum', function (done) {
        server.inject({
            method: 'post',
            url: '/forums',
            payload: JSON.stringify({
                name: 'test1',
                description: 'best forum ever 1',
                parent_id: 1
            }),
            headers: {
                Authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            forum = JSON.parse(res.payload);
            code.expect(forum.name).to.equal('test1');
            done();
        });
    });
    lab.test('can get forums', function (done) {
        server.inject({
            method: 'get',
            url: '/forums/' + forum.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            var pl = JSON.parse(res.payload);
            code.expect(pl.name).to.equal('test1');
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
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            var pl = JSON.parse(res.payload);
            code.expect(pl.name).to.equal('test2');
            done();
        });
    });
    lab.test("can't update forum with unauthed user", function (done) {
        server.inject({
            method: 'put',
            url: '/forums/' + forum.id,
            payload: JSON.stringify({
                name: 'test2',
            }),
            headers: {
                authorization: 'Bearer ' + jwt.sign({
                    user_id: 'derpina',
                    scopes: ['forum_admin']
                }, config.jwtKey, {expiresInMinutes: 15})
                /*
                gateway: JSON.stringify({
                    client_id: 'foo',
                    user_id: 'derpina',
                    api: 'yeti-threads-api',
                    scopes: ['forum_admin']
                })
                */
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(403);
            done();
        });
    });
    lab.test("get 404 on bad id", function (done) {
        server.inject({
            method: 'get',
            url: '/forums/' + -32,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(404);
            done();
        });
    });
    lab.test('can list forums', function (done) {
        server.inject({
            method: 'get',
            url: '/forums',
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            var pl = JSON.parse(res.payload);
            code.expect(pl.count).to.equal(2);
            done();
        });
    });
    lab.test('can delete forum', function (done) {
        server.inject({
            method: 'delete',
            url: '/forums/' + forum.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});

lab.experiment('threads', function () {
    var forum;
    var thread;
    lab.before(function (done) {
        server.inject({
            method: 'post',
            url: '/forums',
            payload: JSON.stringify({
                name: 'test3',
                description: 'best forum ever 2',
                parent_id: 1
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            forum = JSON.parse(res.payload);
            code.expect(forum.name).to.equal('test3');
            done();
        });
    });
    lab.before(function (done) {
        server.inject({
            method: 'post',
            url: '/access/tester-user/forum/' + forum.id,
            payload: JSON.stringify({
                write: true,
                read: true,
                post: true
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            done();
        });
    });

    lab.test('can create thread', function (done) {
        server.inject({
            method: 'post',
            url: '/threads',
            payload: JSON.stringify({
                subject: 'test thread 1',
                forum_id: forum.id,
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            thread = JSON.parse(res.payload);
            code.expect(thread.subject).to.equal('test thread 1');
            code.expect(thread.forum_id).to.equal(forum.id);
            done();
        });
    });

    lab.test('can get thread', function (done) {
        server.inject({
            method: 'get',
            url: '/threads/' + thread.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            pl = JSON.parse(res.payload);
            code.expect(pl.subject).to.equal('test thread 1');
            code.expect(pl.forum_id).to.equal(forum.id);
            done();
        });
    });

    lab.test('can list threads', function (done) {
        server.inject({
            method: 'get',
            url: '/threads',
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            pl = JSON.parse(res.payload);
            code.expect(pl.count).to.equal(1);
            code.expect(pl.results[0].forum_id).to.equal(forum.id);
            done();
        });
    });

    lab.test('can delete thread', function (done) {
        server.inject({
            method: 'delete',
            url: '/threads/' + thread.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });

    lab.after(function (done) {
        server.inject({
            method: 'delete',
            url: '/forums/' + forum.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});

lab.experiment('posts', function () {
    var forum;
    var thread;
    var post1, post2, post3, post4;
    lab.before(function (done) {
        server.inject({
            method: 'post',
            url: '/forums',
            payload: JSON.stringify({
                name: 'test3',
                description: 'best forum ever 1',
                parent_id: 1
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            forum = JSON.parse(res.payload);
            code.expect(forum.name).to.equal('test3');
            done();
        });
    });
    lab.before(function (done) {
        server.inject({
            method: 'post',
            url: '/access/tester-user/forum/' + forum.id,
            payload: JSON.stringify({
                write: true,
                read: true,
                post: true
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            done();
        });
    });

    lab.test('can create thread', function (done) {
        server.inject({
            method: 'post',
            url: '/threads',
            payload: JSON.stringify({
                subject: 'test thread 1',
                forum_id: forum.id,
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            thread = JSON.parse(res.payload);
            code.expect(thread.subject).to.equal('test thread 1');
            code.expect(thread.forum_id).to.equal(forum.id);
            done();
        });
    });

    lab.test('can create post', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 1',
                thread_id: thread.id,
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post1 = JSON.parse(res.payload);
            code.expect(post1.body).to.equal('test post 1');
            code.expect(post1.thread_id).to.equal(thread.id);
            done();
        });
    });
    lab.test('can create post 2', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 2',
                thread_id: thread.id,
                parent_id: post1.id
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post2 = JSON.parse(res.payload);
            code.expect(post2.body).to.equal('test post 2');
            code.expect(post2.thread_id).to.equal(thread.id);
            done();
        });
    });
    lab.test('can create post 3', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 3',
                thread_id: thread.id,
                parent_id: post1.id
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post3 = JSON.parse(res.payload);
            code.expect(post3.body).to.equal('test post 3');
            code.expect(post3.thread_id).to.equal(thread.id);
            done();
        });
    });
    lab.test('can create post 4', function (done) {
        server.inject({
            method: 'post',
            url: '/posts',
            payload: JSON.stringify({
                body: 'test post 4',
                thread_id: thread.id,
                parent_id: post2.id
            }),
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(201);
            code.expect(res.payload).to.not.equal('');
            post4 = JSON.parse(res.payload);
            code.expect(post4.body).to.equal('test post 4');
            code.expect(post4.thread_id).to.equal(thread.id);
            done();
        });
    });

    lab.test('can get posts in threaded order', function (done) {
        server.inject({
            method: 'get',
            url: '/threads/' + thread.id + '/posts',
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            code.expect(res.payload).to.not.equal('');
            pl = JSON.parse(res.payload);
            code.expect(pl.count).to.equal(4);
            code.expect(pl.results[0].body).to.equal('test post 1');
            code.expect(pl.results[1].body).to.equal('test post 2');
            code.expect(pl.results[2].body).to.equal('test post 4');
            code.expect(pl.results[3].body).to.equal('test post 3');
            done();
        });
    });

    lab.test('can delete post', function (done) {
        server.inject({
            method: 'delete',
            url: '/posts/' + post1.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });

    lab.test('get changelog', function (done) {
        server.inject({
            method: 'get',
            url: '/changes?when=' + start,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            var pl = JSON.parse(res.payload);
            code.expect(pl.results.length).to.equal(9);
            done();
        });
    });

    lab.after('can delete thread', function (done) {
        server.inject({
            method: 'delete',
            url: '/threads/' + thread.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });

    lab.after(function (done) {
        server.inject({
            method: 'delete',
            url: '/forums/' + forum.id,
            headers: {
                authorization: authorization
            }
        }, function (res) {
            code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});
