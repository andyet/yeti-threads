var Forums = require('./controllers/forums');

exports.register = function (plugin, options, done) {
    var server = plugin;

    plugin.bind({
    });

    //forum
    server.route({ method: 'get', path: '/forums/{forum_id}', config: Forums.get});
    server.route({ method: 'get', path: '/forumTree', config: Forums.getTree});
    server.route({ method: 'put', path: '/forums/{forum_id}', config: Forums.update});
    server.route({ method: 'post', path: '/forums', config: Forums.create});
    server.route({ method: 'delete', path: '/forums/{forum_id}', config: Forums.delete});
    //post
    //put

    return done();
};

exports.register.attributes = { pkg: require('./package.json') };
