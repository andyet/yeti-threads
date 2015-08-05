var EventEmitter = require('events').EventEmitter;
var ForumModel = require('./models/forum');
var WS = require('ws');
var jwt = require('jsonwebtoken');
var config = require('getconfig');

module.exports = function (db, server) {
    var forumEvents = new EventEmitter();
    var accessEvents = new EventEmitter();

    db.query("LISTEN forums_log");
    db.query("LISTEN access_log");
    db.on('notification', function (msg) {
        console.log(msg.channel, msg.payload);
        var log = JSON.parse(msg.payload);
        if (msg.channel === 'forums_log') {
            forumEvents.emit('forum:' + log.forum_id, msg.payload);
        } else if (msg.channel === 'access_log') {
            accessEvents.emit('user:' + log.user_id, log);
        }
    });

    var ws = new WS.Server({
        server: server.listener,
        path: '/updates',
        verifyClient: function (info, callback) {
            if (!info.req.headers.authorization) {
                server.log(['info', 'websocket', 'auth'], 'No authorization supplied')
                return callback(false, 401, 'No authorization supplied');
            }
            jwt.verify(info.req.headers.authorization.split('Bearer ')[1], config.jwtKey, function (err, value) {
                if (err) {
                    server.log(['info', 'websocket', 'auth'], err)
                    return callback(false, 401, err);
                }
                return callback(true);
            })
        }
    });

    ws.on('connection', function (socket) {
        server.log(['info', 'websocket'], 'new client')
        jwt.verify(socket.upgradeReq.headers.authorization.split('Bearer ')[1], config.jwtKey, function (err, value) {
            var auth = value;
            var user_id = auth.user;
            var access = {};
            function sendUpdate (update) {
                if (socket.readyState === WS.OPEN) {
                    socket.send(update);
                }
            }
            function onAccess(change) {
                if (change.access === true ) {
                    access[change.forum_id] = true;
                    forumEvents.on('forum:' + change.forum_id, sendUpdate);
                    console.log("listening to forum:", change.forum_id);
                } else {
                    forumEvents.removeListener('forum:' + change.forum_id, sendUpdate);
                    delete access[change.forum_id];
                    console.log('closing out forum', change.forum_id);
                }
            }
            accessEvents.on('user:' + user_id, onAccess);
            ForumModel.getIds(user_id, function (err, result) {
                result.ids.forEach(function (id) {
                    console.log("listening to forum:", id);
                    access[id] = true;
                    forumEvents.on('forum:' + id, sendUpdate);
                });
            });
            socket.once('close', function () {
                accessEvents.removeListener('user:' + user_id, onAccess);
                Object.keys(access).forEach(function (id) {
                    console.log('closing out forum', id);
                    forumEvents.removeListener('forum:' + id, sendUpdate);
                });
            });
        })
    });

};
