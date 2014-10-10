var _ = require('lodash');
var Connection = require('./Connection');
var helpers = require('./helpers');
var stringify = helpers.stringify;

var initialGameState = { isRunning: true };

function isPlayerValid(player){
    return player.characters.length > 0;
}

function isLobbyReady(lobbyArray) {
    return _.reduce(lobbyArray, function(e1, e2) {
        return isPlayerValid(e1) && isPLayerValid(e2);
    });
}

function getPlayers(obj){
    return _.pluck(obj, 'player');
}

function convertToGame(lobby){
    return {
        gameState: initialGameState,
        players: lobby.players
    };
}

function notifyInGame(player) {
    Connection.getByUser(player).socket.write(stringyfy({
        status: 'success',
        value: initialGameState
    }));
}

function moveToGame(delay) {
    var poolLobbies = Pool.getByLabel('lobbies');
    var poolGames = Pool.getbyLabel('');

    return setInterval( function() {
        if( poolLobbies.lobbies.length <= 0 ) { return; }

        
        _.chain(poolLobbies.lobbies)
            .filter(isLobbyReady)
            .map(convertToGame)
            .each(function(game){
                debugger;
                poolGames.push(game);
                _.each(getPlayers(game), notifyInGame);
            });

    }, delay);
}

module.exports = moveToGame;
