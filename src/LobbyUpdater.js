var _ = require('lodash');
var util = require('util');

var Pool = require('./Pool');
var Characters = require('./Characters');

var helpers = require('./helpers');
var log = helpers.log;

var actions = {
    'set:characters': setCharacters
};

function setCharacters(conn, data) {
    var lobby = Pool.getByLabel('lobbies').getByUser(conn.user);
    var user = _.find(lobby, function(player) {
        return player.id === conn.user.id;
    });

    if (user) {
        user.characters = _.map(data.value.characters, Characters.getById);
    }
}

module.exports = {
    actions: actions
};
