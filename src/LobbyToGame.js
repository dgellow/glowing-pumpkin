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
                curriedNotify = Connection.notifySuccess.bind(this, game);

                _.each(game.players, curriedNotify);
            });

    }, delay);
}

module.exports = moveToGame;
