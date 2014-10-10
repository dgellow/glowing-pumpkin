var _ = require('lodash');
var util = require('util');

var Pool = require('./Pool');

var helpers = require('./helpers');
var log = helpers.log;

var actions = {
    'set:characters': setCharacters
};

function setCharacters(conn, data) {
    var lobby = Pool.getByLabel('lobbies').getByUser(conn.user.id);
    _.each(lobby, function(player) {
        if(player.id === conn.user.id) {
            player.ready = data.value.ready;
        }
    });
}

module.exports = {
    actions: actions
};
