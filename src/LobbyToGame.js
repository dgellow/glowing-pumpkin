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
    return _.reduce(lobbyArray, function(acc, val) {
        return acc && isPlayerValid(val);
    }, true);
}

function hasLobbyLeaver(lobbyArray) {
    return _.reduce(lobbyArray, function(acc, val) {
        return acc || hasPlayerLeft(val);
    }, false);
}

function convertToGame(lobby){
    return {
        gameState: {isRunning: true},
        players: lobby
    };
}

function handleLeaverInLobby(player) {
    Connection.notifyError(
        "A player has left the lobby",
        player,
        function() {
            // close user connection
            var connection = Connection.getByUser(player);
            if (connection) { connection.close(); }
        }
    );
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
                _.each(lobby, handleLeaverInLobby);
            });

        // move lobbies to games
        _.chain(poolLobbies.lobbies)
            .filter(isLobbyReady)
            .map(convertToGame)
            .each(function(game){
                // move the game to poolGames
                poolGames.push(game);
                // send gamestate to users
                _.each(game.players,
                       Connection.notifySuccess.bind(this, game));
            });

    }, delay);
}

module.exports = moveToGame;
