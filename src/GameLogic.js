var _ = require('lodash');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');
var Connection = require('./Connection');
var Characters = require('./Characters');

function dice(attackSource, defenseTarget) {
    return  Math.random() < attackSource / (attackSource + defenseTarget);
}

function resolutionStep(sourcePlayer, sourceCharacter, targetPlayer,
                        targetCharacter, event, amount) {
    return {
        sourcePlayer: sourcePlayer.id,
        targetPlayer: targetPlayer.id,

        sourceCharacter: sourceCharacter,
        targetCharacter: targetCharacter,

        event: event,
        amount: amount
    };
}

function resolve(game, sourcePlayer) {
    var steps = [];
    var commande = sourcePlayer.commande;

    var targetPlayer = _.find(game.players, function(p) {
        return p.id === commande.targetPlayer;
    });

    var curriedStep = resolutionStep.bind(this,
                                          sourcePlayer, commande.sourceCharacter,
                                          targetPlayer, commande.targetCharacter);

    if (sourcePlayer.hp <= 0) {
        // a dead character cannot do any action
        steps.push(resolutionStep(sourcePlayer, commande.sourceCharacter,
                                  sourcePlayer, commande.sourceCharacter,
                                  'dead'));

    } else if (dice(sourcePlayer.attack, targetPlayer.defense)) {

        var amount = Characters.getModifier(commande.sourceCharacter,
                                            commande.targetCharacter);
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

function setGameState(isRunning, reason, message, value) {
    this.updateTimestamp = new Date().getTime();
    this.isRunning = isRunning;
    this.reason = reason;
    this.message = message;
    this.value = (value) ? value: null;
}

function updateGameState(game) {
    var gameState = game.gameState;
    var gameNotRunning = setGameState.bind(gameState, false);

    // if there is only one player alive
    var alivePlayers = _.filter(game.players, function(p) { return p.hp > 0; });
    if (alivePlayers.length === 1) {
        var winner = _.first(alivePlayers);
        gameNotRunning('game_finished', 'The fight is finished. We have a winner.',
                       {winner: winner.id});
    }

    // if there is only one player connected
    if (game.players.length <= 1) {
        gameNotRunning('not_enough_players', 'There is not enough players to continue the fight');
    }
}

function isGameRunning(game) {
    return game.gameState.isRunning;
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

        // Get games awaiting a response
        _.chain(poolGames.games)
            .filter(isGameRunning)
            .filter(isTurnComplete)
            .each(function(game) {
                var updateSequence = applyLogic(game);
                _.each(game.players, function(player) {
                    notify(player, updateSequence);
                });
                updateGameState(game);
            });

        // Remove games with isRunning === false and updateTimestamp older than 5min
        _.chain(poolGames.games)
            .filter(function(game) {
                return !game.gameState.isRunning;
            })
            .remove(function(game) {
                var min5 = 5 * 60000; // 5 minutes
                var currentTime = new Date().getTime();
                return game.gameState.updateTimestamp &&
                    game.gameState.updateTimestamp < (currentTime - min5);
            });
    }, delay);
}

module.exports = gameLogic;
