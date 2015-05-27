var Forums = require('./controllers/forums');
var Threads = require('./controllers/threads');
var Posts = require('./controllers/posts');
var Access = require('./controllers/access');
var Changes = require('./controllers/changes');

exports.register = function (plugin, options, done) {
    var server = plugin;

    plugin.bind({

    });

    //forum
    server.route({ method: 'get', path: '/forums/{forum_id}', config: Forums.get});
    server.route({ method: 'get', path: '/forums', config: Forums.list});
    server.route({ method: 'get', path: '/forum/tree', config: Forums.getTree});
    server.route({ method: 'put', path: '/forums/{forum_id}', config: Forums.update});
    server.route({ method: 'post', path: '/forums', config: Forums.create});
    server.route({ method: 'delete', path: '/forums/{forum_id}', config: Forums.delete});
    server.route({ method: 'get', path: '/forums/{forum_id}/threads', config: Threads.listByForum});

    server.route({ method: 'get', path: '/threads', config: Threads.list});
    server.route({ method: 'get', path: '/threads/{thread_id}', config: Threads.get});
    server.route({ method: 'get', path: '/threads/{thread_id}/posts', config: Posts.listByThread});
    server.route({ method: 'post', path: '/threads', config: Threads.create});
    server.route({ method: 'put', path: '/threads/{thread_id}', config: Threads.update});
    server.route({ method: 'delete', path: '/threads/{thread_id}', config: Threads.delete});

    server.route({ method: 'get', path: '/posts', config: Posts.list});
    server.route({ method: 'get', path: '/posts/{post_id}', config: Posts.get});
    server.route({ method: 'update', path: '/posts/{post_id}', config: Posts.update});
    server.route({ method: 'post', path: '/posts', config: Posts.create});
    server.route({ method: 'delete', path: '/posts/{post_id}', config: Posts.delete});

    server.route({ method: 'post', path: '/access/{user_id}/forum/{forum_id}', config: Access.create});
    server.route({ method: 'get', path: '/access/{user_id}/forum/{forum_id}', config: Access.get});
    server.route({ method: 'put', path: '/access/{user_id}/forum/{forum_id}', config: Access.update});

    server.route({ method: 'get', path: '/changes', config: Changes.listByDateAndUser });

    return done();
};

exports.register.attributes = { pkg: require('./package.json') };
