var _ = require('lodash');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');
var Connection = require('./Connection');

function isPlayerValid(player){
    return player.characters.length > 0 &&
        !player.hasLeft;
}

function hasPlayerLeft(player) {
    return player.hasLeft;
}

function isLobbyReady(lobbyArray) {
    return _.reduce(lobbyArray, function(e1, e2) {
        return isPlayerValid(e1) && isPlayerValid(e2);
    });
}

function hasLobbyLeaver(lobbyArray) {
    return _.reduce(lobbyArray, function(e1, e2) {
        return hasPlayerLeft(e1) || hasPlayerLeft(e2);
    });
}

function convertToGame(lobby){
    return {
        gameState: {isRunning: true},
        players: lobby
    };
}

function notifyInGame(status, player, value) {
    var obj = _.extend({status: status},
                       value || {});

    var connection = Connection.getByUser(player);
    if (connection) {
        connection.socket.write(stringify(obj));
    }
}

function notifySuccess(game, player) {
    notifyInGame('success', player, {value: game});
}

function notifyError(player) {
    var error = {message: 'A player left the lobby'};
    notifyInGame('error', player, error);

    // close user connection
    var connection = Connection.getByUser(player);
    if (connection) { connection.close(); }
}

function moveToGame(delay) {
    var poolLobbies = Pool.getByLabel('lobbies');
    var poolGames = Pool.getByLabel('games');

    return setInterval( function() {
        if( poolLobbies.lobbies.length <= 0 ) { return; }

        // if a player has left, notify others
        _.chain(poolLobbies.lobbies)
            .filter(hasLobbyLeaver)
            .each(function(lobby) {
                _.each(lobby, notifyError);
            });

        // move lobbies to games
        _.chain(poolLobbies.lobbies)
            .filter(isLobbyReady)
            .map(convertToGame)
            .each(function(game){
                poolGames.push(game);
                curriedNotify = notifySuccess.bind(this, game);
                _.each(game.players, curriedNotify);
            });

    }, delay);
}

module.exports = moveToGame;
