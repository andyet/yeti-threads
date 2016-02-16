'use strict';
/* jshint expr: true */

const Boom = require('boom');
const config = require('getconfig');
const gatepost = require('gatepost')(config.db);
const lab = exports.lab = require('lab').script();
const Hapi = require('hapi');
const code = require('code');
const jwt = require('jsonwebtoken');
const pg = require('pg');

config.jwtKey = require('crypto').randomBytes(48).toString('base64');
const token = jwt.sign({
  user: 'tester-user',
  scope: ['forum_admin']
}, config.jwtKey, { expiresIn: 900 });
const authorization = `Bearer ${token}`;

let start = null;

let server;

lab.experiment('forums', () => {

  let forum;

  lab.before((done) => {
    pg.connect(config.db, (err, client) => {
      client.query('LISTEN forums_log', (err) => {
        done();
      });

      client.on('notification', (msg) => {
        if (start === null) {
          start = JSON.parse(msg.payload).when;
        }
      });
    });
  }),

  lab.before((done) => {
    server = new Hapi.Server();
    server.connection(config.server);

    server.register([
      {
        register: require('hapi-auth-jwt')
      },
      {
        register: require('../'),
        options: {
          jwtKey: config.jwtKey,
          gatepost
        }
      },
      {
        register: require('drboom'),
        options: {
          plugins: [
            require('drboom-pg')({ }),
            require('drboom-gatepost')({ Boom: Boom, Gatepost: gatepost }),
            require('drboom-joi')({ Boom })
          ]
        }
      }
    ], (err) => {
      if (err) {
        throw err;
      }
      done();
    });
  });

  lab.before((done) => {
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
    }, (res) => {
      done();
    });
  });

  lab.test('can create forum', (done) => {
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
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      forum = JSON.parse(res.payload);
      code.expect(forum.name).to.equal('test1');
      done();
    });
  });
  lab.test('can get forums', (done) => {
    server.inject({
      method: 'get',
      url: `/forums/${forum.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      code.expect(res.payload).to.not.equal('');
      const pl = JSON.parse(res.payload);
      code.expect(pl.name).to.equal('test1');
      done();
    });
  });

  lab.test('can update forum', (done) => {
    server.inject({
      method: 'put',
      url: `/forums/${forum.id}`,
      payload: JSON.stringify({
        name: 'test2'
      }),
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      code.expect(res.payload).to.not.equal('');
      const pl = JSON.parse(res.payload);
      code.expect(pl.name).to.equal('test2');
      done();
    });
  });
  lab.test('can\'t update forum with unauthed user', (done) => {
    server.inject({
      method: 'put',
      url: `/forums/${forum.id}`,
      payload: JSON.stringify({
        name: 'test2'
      }),
      headers: {
        authorization: `Bearer ${ jwt.sign({
          user_id: 'derpina',
          scopes: ['forum_admin']
        }, config.jwtKey, { expiresIn: 900 }) }`
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(403);
      done();
    });
  });
  lab.test('get 404 on bad id', (done) => {
    server.inject({
      method: 'get',
      url: '/forums/-32',
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(404);
      done();
    });
  });
  lab.test('can list forums', (done) => {
    server.inject({
      method: 'get',
      url: '/forums',
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      code.expect(res.payload).to.not.equal('');
      const pl = JSON.parse(res.payload);
      code.expect(pl.count).to.equal(2);
      done();
    });
  });
  lab.test('can delete forum', (done) => {
    server.inject({
      method: 'delete',
      url: `/forums/${forum.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      done();
    });
  });
});

lab.experiment('threads', () => {
  let forum;
  let thread;
  lab.before((done) => {
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
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      forum = JSON.parse(res.payload);
      code.expect(forum.name).to.equal('test3');
      done();
    });
  });
  lab.before((done) => {
    server.inject({
      method: 'post',
      url: `/access/tester-user/forum/{$forum.id}`,
      payload: JSON.stringify({
        write: true,
        read: true,
        post: true
      }),
      headers: {
        authorization: authorization
      }
    }, (res) => {
      done();
    });
  });

  lab.test('can create thread', (done) => {
    server.inject({
      method: 'post',
      url: '/threads',
      payload: JSON.stringify({
        subject: 'test thread 1',
        forum_id: forum.id
      }),
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      thread = JSON.parse(res.payload);
      code.expect(thread.subject).to.equal('test thread 1');
      code.expect(thread.forum_id).to.equal(forum.id);
      done();
    });
  });

  lab.test('can get thread', (done) => {
    server.inject({
      method: 'get',
      url: `/threads/${thread.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      code.expect(res.payload).to.not.equal('');
      const pl = JSON.parse(res.payload);
      code.expect(pl.subject).to.equal('test thread 1');
      code.expect(pl.forum_id).to.equal(forum.id);
      done();
    });
  });

  lab.test('can list threads', (done) => {
    server.inject({
      method: 'get',
      url: '/threads',
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      code.expect(res.payload).to.not.equal('');
      const pl = JSON.parse(res.payload);
      code.expect(pl.count).to.equal(1);
      code.expect(pl.results[0].forum_id).to.equal(forum.id);
      done();
    });
  });

  lab.test('can delete thread', (done) => {
    server.inject({
      method: 'delete',
      url: `/threads/${thread.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      done();
    });
  });

  lab.after((done) => {
    server.inject({
      method: 'delete',
      url: `/forums/${forum.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      done();
    });
  });
});

lab.experiment('posts', () => {
  let forum;
  let thread;
  let post1;
  let post2;
  let post3;
  let post4;
  lab.before((done) => {
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
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      forum = JSON.parse(res.payload);
      code.expect(forum.name).to.equal('test3');
      done();
    });
  });
  lab.before((done) => {
    server.inject({
      method: 'post',
      url: `/access/tester-user/forum/${forum.id}`,
      payload: JSON.stringify({
        write: true,
        read: true,
        post: true
      }),
      headers: {
        authorization: authorization
      }
    }, (res) => {
      done();
    });
  });

  lab.test('can create thread', (done) => {
    server.inject({
      method: 'post',
      url: '/threads',
      payload: JSON.stringify({
        subject: 'test thread 1',
        forum_id: forum.id
      }),
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      thread = JSON.parse(res.payload);
      code.expect(thread.subject).to.equal('test thread 1');
      code.expect(thread.forum_id).to.equal(forum.id);
      done();
    });
  });

  lab.test('can get threads by forum', (done) => {
    server.inject({
      method: 'get',
      url: `/forums/${forum.id}/threads`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      code.expect(res.payload).to.not.equal('');
      const threads = JSON.parse(res.payload);
      const util = require('util');
      console.log('\n', util.format(threads));
      code.expect(threads.results[0].subject).to.equal('test thread 1');
      code.expect(threads.results[0].forum_id).to.equal(forum.id);
      done();
    });
  });

  lab.test('can create post', (done) => {
    server.inject({
      method: 'post',
      url: '/posts',
      payload: JSON.stringify({
        body: 'test post 1',
        thread_id: thread.id
      }),
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      post1 = JSON.parse(res.payload);
      code.expect(post1.body).to.equal('test post 1');
      code.expect(post1.thread_id).to.equal(thread.id);
      done();
    });
  });
  lab.test('can create post 2', (done) => {
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
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      post2 = JSON.parse(res.payload);
      code.expect(post2.body).to.equal('test post 2');
      code.expect(post2.thread_id).to.equal(thread.id);
      done();
    });
  });
  lab.test('can create post 3', (done) => {
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
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      post3 = JSON.parse(res.payload);
      code.expect(post3.body).to.equal('test post 3');
      code.expect(post3.thread_id).to.equal(thread.id);
      done();
    });
  });
  lab.test('can create post 4', (done) => {
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
    }, (res) => {
      code.expect(res.statusCode).to.equal(201);
      code.expect(res.payload).to.not.equal('');
      post4 = JSON.parse(res.payload);
      code.expect(post4.body).to.equal('test post 4');
      code.expect(post4.thread_id).to.equal(thread.id);
      done();
    });
  });

  lab.test('can get posts in threaded order', (done) => {
    server.inject({
      method: 'get',
      url: `/threads/${thread.id}/posts`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      code.expect(res.payload).to.not.equal('');
      const pl = JSON.parse(res.payload);
      code.expect(pl.count).to.equal(4);
      code.expect(pl.results[0].body).to.equal('test post 1');
      code.expect(pl.results[1].body).to.equal('test post 2');
      code.expect(pl.results[2].body).to.equal('test post 4');
      code.expect(pl.results[3].body).to.equal('test post 3');
      done();
    });
  });

  /*

  lab.test('can delete post', (done) => {
    server.inject({
      method: 'delete',
      url: `/posts/${post1.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      done();
    });
  });

  lab.test('get changelog', (done) => {
    server.inject({
      method: 'get',
      url: `/changes?when=${start}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      const pl = JSON.parse(res.payload);
      code.expect(pl.results.length).to.equal(9);
      done();
    });
  });

  lab.after('can delete thread', (done) => {
    server.inject({
      method: 'delete',
      url: `/threads/${thread.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      done();
    });
  });

  lab.after((done) => {
    server.inject({
      method: 'delete',
      url: `/forums/${forum.id}`,
      headers: {
        authorization: authorization
      }
    }, (res) => {
      code.expect(res.statusCode).to.equal(200);
      done();
    });
  });
  */
});
