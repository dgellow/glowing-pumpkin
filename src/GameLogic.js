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

function attack(game, sourcePlayer) {
    var steps = [];
    var commande = sourcePlayer.commande;

    var targetPlayer = _.find(game.players, function(p) {
        return p.id === commande.targetPlayer;
    });

    var curriedStep = resolutionStep.bind(this,
                                          sourcePlayer, commande.sourceCharacter,
                                          targetPlayer, commande.targetCharacter);
    if (targetPlayer.hasLeft) {
        steps.push(curriedStep('miss'));
    } else if (sourcePlayer.hp <= 0) {
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

    return steps;
}

function escape(sourcePlayer) {
    var commande = sourcePlayer.commande;

    sourcePlayer.hasLeft = true;
    return resolutionStep(sourcePlayer, commande.sourceCharacter,
                          sourcePlayer, commande.sourceCharacter,
                         'escape');
}

function resolve(game, sourcePlayer) {
    var steps = [];
    var event = sourcePlayer.commande.event;

    if (event === 'escape' || sourcePlayer.hasLeft) {
        steps.push(escape(sourcePlayer));
    } else if (event === 'attack') {
        steps.push(_.flatten(attack(game, sourcePlayer)));
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
    var winner = {};

    var alivePlayers = _.filter(game.players, function(p) { return p.hp > 0; });
    var connectedPlayers = _.filter(game.players, function(p) { return p.hasLeft !== true; });

    if (!gameState.isRunning) {
        return ;
    }

    // if there is only one player alive
    else if (alivePlayers.length === 1) {
        winner = _.first(alivePlayers);
        gameNotRunning('game_finished', 'The fight is finished. We have a winner.',
                       {winner: winner.id});
    }

    // if there is only one player connected
    else if (connectedPlayers.length === 1) {
        winner = _.first(connectedPlayers);
        gameNotRunning('other_players_left', 'Other players have left the fight.',
                       {winner: winner.id});
    }

    // if there is no players connected
    else if (connectedPlayers.length < 1) {
        gameNotRunning('all_players_left', 'All players have left the fight.');
    }
}

function isGameRunning(game) {
    return game.gameState.isRunning;
}

function isPlayerValid(player) {
    return player.commande;
}

function hasPlayerLeft(player) {
    return player.hasLeft;
}

function isTurnComplete(game) {
    return _.chain(game.players)
        .map(function(player) {
            return isPlayerValid(player);
        })
        .every()
        .value();
}


function hasGameLeaver(game) {
    return _.chain(game.players)
        .map(function(player) {
            return hasPlayerLeft(player);
        })
        .any()
        .value();
}

function handleLeaverBeforeCommandeSelection(player) {
    player.commande = {'event': 'escape'};
}

function gameLogic(delay) {
    var poolGames = Pool.getByLabel('games');

    return setInterval(function() {
        if (poolGames.games.length <= 0) { return; }

        // if a player has left, handle the situation
        _.chain(poolGames.games)
            .filter(hasGameLeaver)
            .each(function(game) {
                _.each(game.players, handleLeaverBeforeCommandeSelection);
            });

        // Get games awaiting a response
        _.chain(poolGames.games)
            .filter(isGameRunning)
            .each(function(game) {

                if (isTurnComplete(game)) {
                    var updateSequence = applyLogic(game);
                    _.each(game.players, function(player) {
                        Connection.notifySuccess(updateSequence, player);
                    });
                }
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
