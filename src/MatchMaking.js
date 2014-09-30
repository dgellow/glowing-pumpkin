var _ = require('lodash');
var util = require('util');

var User = require('./User');
var Connection = require('./Connection');
var Pool = require('./Pool');

var helpers = require('./helpers');
var log = helpers.log;
var wrapText = helpers.wrapText;

function matchMaking(delay) {
    var poolSearch = Pool.getByLabel('searchGame');
    var poolLobbies = Pool.getByLabel('lobbies');

    return setInterval(function() {
        if (poolSearch.users.length < 2) {
            return;
        }

        var opponents = _.take(poolSearch.users, 2);
        _.each(opponents, function(userId, index) {
            poolLobbies.push(userId);
            var connection = Connection.getByUser(userId);
            var otherUserId = opponents[(index) ? 0 : 1];
            var otherUser = User.getById(otherUserId);

            if (otherUser && connection) {
                connection.socket.write(wrapText(
                    'Found opponent: ' + util.inspect(otherUser)
                ));
            }
        });

        log('Search games: ' + util.inspect(poolSearch));
        log('Lobbies: ' + util.inspect(poolLobbies));
    }, delay);
}

module.exports = matchMaking;
