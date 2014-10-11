var _ = require('lodash');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');
var Connection = require('./Connection');

var modificateurs = {
    vampire: {vampire: 1},
    meta: {meta: 0}
};

function dice(attackSource, defenseTarget) {
    return  Math.random() < attackSource / (attackSource + defenseTarget);
}

function resolutionStep(sourcePlayer, sourceCharacter, targetPlayer,
                        targetCharacter, event, amount) {
    return {
        sourcePlayer: sourcePlayer.id,
        sourceCharacter: sourceCharacter.id,
        targetCharacter: targetCharacter.id,
        targetPlayer: targetPlayer.id,
        event: event,
        amount: amount
    };
}

function resolve(game, sourcePlayer) {
    var steps = [];
    var commande = sourcePlayer.commande;

    var sourceCharacter = commande.sourceCharacter;
    var sourceType = sourceCharacter.type;
    var targetCharacter = commande.targetCharacter;
    var targetType = targetCharacter.type;
    var targetPlayer = _.find(game.players, function(p) {
        return p.id === commande.targetPlayer;
    });

    var curriedStep = resolutionStep.bind(this,
                                          sourcePlayer, sourceCharacter,
                                          targetPlayer, targetCharacter);

    if (sourcePlayer.hp <= 0) {
        // a dead character cannot do any action
        steps.push(resolutionStep(sourcePlayer, sourceCharacter, sourcePlayer, sourceCharacter, 'dead'));
    } else if (dice(sourcePlayer.attack, targetPlayer.defense)) {
        var amount = modificateurs[sourceType][targetType];
        targetPlayer.hp -= amount;

        steps.push(curriedStep('attack', amount));

        if(targetPlayer.hp <= 0) {
            steps.push(curriedStep('kill'));
        }
    } else {
        steps.push(curriedStep('miss'));
    }

    sourcePlayer.commande = null;

    return steps;
}

function applyLogic(game) {
    return _.chain(game.players)
        .sortBy(function(p) { return -p.speed; })
        .map(resolve.bind(this, game))
        .flatten()
        .value();
}

function updateGameState(game) {
    var gameState = game.gameState;

    // if there is only one player alive
    var alivePlayers = _.filter(game.players, function(p) { return p.hp > 0; });
    if (alivePlayers.length <= 1) {
        gameState.isRunning = false;
    }

    // if there is only one player connected
    if (game.players.length <= 1) {
        gameState.isRunning = false;
    }
}

function isTurnComplete(game) {
    return _.chain(game.players)
        .map(function(player) {
            return !!player.commande;
        })
        .every()
        .value();
}

function notify(player, value) {
    var connection = Connection.getByUser(player);
    if (connection) {
        connection.socket.write(stringify({
            status: 'success',
            value: value
        }));
    }
}

function gameLogic(delay) {
    var poolGames = Pool.getByLabel('games');

    return setInterval(function() {
        if (poolGames.games.length <= 0) { return; }

        _.chain(poolGames.games)
            .filter(isTurnComplete)
            .each(function(game) {
                var updateSequence = applyLogic(game);
                _.each(game.players, function(player) {
                    notify(player, updateSequence);
                });
                updateGameState(game);
            });

    }, delay);
}

module.exports = gameLogic;
