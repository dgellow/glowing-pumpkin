var _ = require('lodash');

var Pool = require('./Pool');


// a lobby is an array containing UserInLobby objects
// [{color: 'red', ready: true, id: 'uuid-user1', name: 'sam le brave'},
//  {ready: 'pink', ready: null, id: 'uuid-user2', name: 'andré du 1018'}]

var PoolLobbies = function() {
    Pool.call(this, 'lobbies');
    this.lobbies = [];
};

PoolLobbies.prototype = Object.create(Pool.prototype);
PoolLobbies.prototype.constructor = PoolLobbies;

PoolLobbies.prototype.add = function(lobby) {
    return this.lobbies.push(lobby);
};

PoolLobbies.prototype.remove = function(user) {
    return _.remove(this.lobbies, function(lobby) {
        return _.findWhere(lobby, {id: user.id});
    });
};

PoolLobbies.prototype.removeUser = function(user) {
    _.chain(this.lobbies)
        .each(function(lobby) {
            var u = _.find(lobby, function(player) {
                return player.id === user.id;
            });

            if (u) { u.hasLeft = true; }
        });
    return this.lobbies;
};

PoolLobbies.prototype.push = function(lobby) {
    var otherPools = this.selectOtherPools();

    // we remove each user in the lobby from other pools
    _.each(lobby, function(user) {
        _.each(otherPools, function(pool) {
            pool.remove(user);
        });
    });

    // add lobby into this pool
    this.add(lobby);
};

PoolLobbies.prototype.getByUser = function(user) {
    return _.chain(this.lobbies)
        .find(function(lobby) {
            return _.where(lobby, {id: user.id});
        })
        .value();
};

module.exports = PoolLobbies;
