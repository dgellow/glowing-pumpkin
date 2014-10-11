var _ = require('lodash');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');
var Connection = require('./Connection')

var actions = {
    'get:gamestate': getCurrentGamestate,
    'set:commande': setCommande
};

function gameStateByUser(user) {
    return Pool.getByLabel('games')
        .getByUser(user)
        .gameState;
}

function getCurrentGamestate(conn, data) {
    Connection.getByUser(conn.user).socket.write(stringify({
        status: "success",
        gameState: gameStateByUser(conn.user)
    }));
}

function setCommande(conn, data) {
    var game = Pool.getByLabel('games').getByUser(conn.user);
    var user = _.where(game.players, {id: conn.user.id});
    debugger;
    user.command = data.value.setCommande;
}

module.exports = {
    actions: actions
};
