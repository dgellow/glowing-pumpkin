var _ = require('lodash');
var util = require('util');

var User = require('./User');
var Connection = require('./Connection');
var Pool = require('./Pool');

var helpers = require('./helpers');
var log = helpers.log;
var stringify = helpers.stringify;

// poolSearch ----> take 2 users to create a lobby ----> move the lobby in poolLobbies
function matchMaking(delay) {
    var poolSearch = Pool.getByLabel('search');
    var poolLobbies = Pool.getByLabel('lobbies');

    return setInterval(function() {
        if (poolSearch.users.length < 2) {
            return;
        }

        // take 2 users and create a lobby
        var lobby = _.chain(poolSearch.users)
            .take(2)
            .map(function(player) {
                return _.extend(player, {ready: null, characters: []});
            })
            .value();

        // move them in poolLobbies
        poolLobbies.push(lobby);

        // notify users
        _.each(lobby, function(userId, index) {
            var connection = Connection.getByUser(userId);
            var otherUserId = lobby[(index) ? 0 : 1];
            var otherUser = User.getById(otherUserId);

            User.getById(otherUserId)
                .then(function(otherUser) {
                    connection.socket.write(stringify({
                        status: 'success',
                        opponent: otherUser
                    }));
                })
                .catch(function(err) {
                    connection.socket.write(stringify({
                        status: 'error',
                        message: err.name + ': ' + err.message
                    }));
                }).done();
        });

        log('Search games: ' + util.inspect(poolSearch));
        log('Lobbies: ' + util.inspect(poolLobbies));
    }, delay);
}

module.exports = matchMaking;
