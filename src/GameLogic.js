var _ = require('lodash');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');
var Connection = require('./Connection');

function applyLogic(game) {
    // todo
    return game;
}

function isTurnComplete(game) {
    return _.chain(game.players)
        .map(function(player) {
            return !!player.commande;
        })
        .every()
        .value();
}

function notify(player, logicalProcess) {
    Connection.getByUser(player).socket.write(stringify({
        status: 'success',
        value: logicalProcess
    }));
}

function gameLogic(delay) {
    var poolGames = Pool.getByLabel('games');

    return setInterval(function() {
        if (poolGames.games.length <= 0) { return; }

        _.chain(poolGames.games)
            .filter(isTurnComplete)
            .each(function(game) {
                var logicalProcess = applyLogic(game);
                _.each(game.players, function(player) {
                    notify(player, logicalProcess);
                });
            });

    }, delay);
}

module.exports = gameLogic;
