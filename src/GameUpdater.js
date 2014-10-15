var _ = require('lodash');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');
var Connection = require('./Connection');

var actions = {
    'get:gamestate': getCurrentGamestate,
    'set:commande': setCommande
};

function gameStateByUser(user) {
    var game = Pool.getByLabel('games').getByUser(user);
    return game ? game.gameState : null;
}

function getCurrentGamestate(conn, data) {
    var gameState = gameStateByUser(conn.user);
    if (gameState) {
        Connection.notifySuccess(gameState, conn.user);
    } else {
        Connection.notifyError("GameState cannot be retrieved, either no game or wrong user", conn.user);
    }
}

function setCommande(conn, data) {
    var game = Pool.getByLabel('games').getByUser(conn.user);
    var user = _.findWhere(game.players, {id: conn.user.id});
    user.commande = data.value.commande;
}

module.exports = {
    actions: actions
};
