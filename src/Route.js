var _ = require('lodash');
var util = require('util');

var helpers = require('./helpers');
var condHasAttr = helpers.condHasAttr;
var stringify = helpers.stringify;

var Pool = require('./Pool');
var LobbyUpdater = require('./LobbyUpdater');
var GameUpdater = require('./GameUpdater');

var actions = {
    'initiate:search:game': initiateSearchGame,
    'interrupt:search:game': interruptSearchGame,
    'enter:lobby': enterLobby,
    'leave:lobby': leaveLobby,
    'enter:game': enterGame,
    'leave:game': leaveGame
};

_.extend(actions, LobbyUpdater.actions, GameUpdater.actions);

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
            Connection.notifyError('The action ' +
                util.inspect(data.action) +
                ' is not managed', conn.user);
        }
    });
}

module.exports = Object.create({
    actions: actions,
    route: route
});
