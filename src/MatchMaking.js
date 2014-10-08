var _ = require('lodash');
var util = require('util');

var User = require('./User');
var Connection = require('./Connection');
var Pool = require('./Pool');

var helpers = require('./helpers');
var log = helpers.log;
var stringify = helpers.stringify;

// poolSearch ----> take 2 users to create a lobby ----> move it in poolLobbies
function matchMaking(delay) {
    var poolSearch = Pool.getByLabel('search');
    var poolLobbies = Pool.getByLabel('lobbies');

    return setInterval(function() {
        if (poolSearch.users.length < 2) {
            return;
        }

        // take 2 users to create a lobby (an [] of users)
        var opponents = _.take(poolSearch.users, 2);

        // move them in poolLobbies
        poolLobbies.push(opponents);

        // notify users
        _.each(opponents, function(userId, index) {
            var connection = Connection.getByUser(userId);
            var otherUserId = opponents[(index) ? 0 : 1];
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
