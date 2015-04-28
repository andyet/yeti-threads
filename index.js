var Forums = require('./controllers/forums');

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

    server.route({ method: 'get', path: '/threads', config: Threads.list});
    server.route({ method: 'get', path: '/threads/{thread_id}/posts', config: Posts.listByThread});
    server.route({ method: 'post', path: '/forums/{forum_id}/threads', config: Threads.create});
    server.route({ method: 'post', path: '/forums/{forum_id}/threads/{thread_id}', config: Threads.moveThread});
    server.route({ method: 'put', path: '/forums/{forum_id}/threads/{thread_id}', config: Threads.update});

    return done();
};

exports.register.attributes = { pkg: require('./package.json') };
