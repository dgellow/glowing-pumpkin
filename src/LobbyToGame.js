var _ = require('lodash');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');
var Connection = require('./Connection');

function isPlayerValid(player){
    return player.characters.length > 0;
}

function isLobbyReady(lobbyArray) {
    return _.reduce(lobbyArray, function(e1, e2) {
        return isPlayerValid(e1) && isPlayerValid(e2);
    });
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
