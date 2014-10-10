var _ = require('lodash');
var initialGameState = { isRunning: false };

function isPlayerValid(player){
    return player.characters.length > 0;
}

function isLobbyReady(lobbyArray) {
    return _.reduce(lobbyArray, function(e1, e2) {
        return isPlayerValid(e1) && isPLayerValid(e2);
    });
}

function getPlayers(obj){
    return _pluck(obj, 'player');
}

function convertToGame(lobby){
    return {
        gameState: initialGameState,
        players: lobby.
    };
}

function notifyInGame(player){

}

function moveToGame(delay) {
    var poolLobbies = Pool.getByLabel('lobbies');
    var poolGames = Pool.getbyLabel('');

    return setInterval( function() {
        if( poolLobbies.lobbies.length <= 0 ) { return; }

        _.chain(poolLobbies.lobbies).filter(isLobbyReady)
        .map(convertToGame)
        .each(function(game){
            poolGames.push(game);
        });

    }, delay);
}

module.exports = moveToGame;
