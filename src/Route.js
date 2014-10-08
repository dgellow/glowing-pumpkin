var _ = require('lodash');
var util = require('util');

var helpers = require('./helpers');
var condHasAttr = helpers.condHasAttr;
var stringify = helpers.stringify;

var Pool = require('./Pool');

var actions = {
    'initiate:search:game': initiateSearchGame,
    'interrupt:search:game': interruptSearchGame,
    'enter:lobby': enterLobby,
    'leave:lobby': leaveLobby,
    'enter:game': enterGame,
    'leave:game': leaveGame
};

// Actions
function initiateSearchGame(conn, data) {
    Pool.getByLabel('search').push(conn.user);
}

function interruptSearchGame(conn, data) {
    Pool.getByLabel('search').remove(conn.user);
}

function enterLobby(conn, data) {
    Pool.getByLabel('lobbies').push(conn.user);
}

function leaveLobby(conn, data) {
    Pool.getByLabel('lobbies').remove(conn.user);
}

function enterGame(conn, data) {
    Pool.getByLabel('games').push(conn.user);
}

function leaveGame(conn, data) {
    Pool.getByLabel('games').remove(conn.user);
}

// Routing, dispatch data received from a client to the correct action
function route(connection, data) {
    condHasAttr(connection, data, ['action'], function(conn, data) {
        if (_.has(actions, data.action)) {
            actions[data.action](conn, data);
        } else {
            conn.socket.write(stringify({
                status: 'error',
                message: 'The action ' +
                    util.inspect(data.action) +
                    ' is not managed'
            }) + '\r\n');
        }
    });
}

module.exports = Object.create({
    actions: actions,
    route: route
});
