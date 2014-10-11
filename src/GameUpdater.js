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
    var user = Pool.getByLabel('games').getByUser(user)
    return user ? user.gameState : null;
}

function notifySucces(user, value){
    Connection.getByUser(user).socket.write(stringify({
        status: "success",
        value: value
    }));
}

function notifyFailure(user, message){
    Connection.getByUser(user).socket.write(stringify({
        status: "Error",
        message: message
    }));
}



function getCurrentGamestate(conn, data) {
    var gameState = gameStateByUser(conn.user);
    if(!!gameState) {
        notifySucces(conn.user, gameState);
    } else {
        notifyFailure(conn.user, "gameState cannot be retreived, either no game or wrong user");
    }
}

function setCommande(conn, data) {
    var game = Pool.getByLabel('games').getByUser(conn.user);
    var user = _.where(game.players, {id: conn.user.id});
    user.command = data.value.setCommande;
}

module.exports = {
    actions: actions
};
