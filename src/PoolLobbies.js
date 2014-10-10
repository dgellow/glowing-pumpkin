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

PoolLobbies.prototype.remove = function(userId) {
    return _.remove(this.lobbies, function(lobby) {
        return _.contains(lobby, userId);
    });
};

PoolLobbies.prototype.push = function(lobby) {
    var otherPools = this.selectOtherPools();

    // we remove each user in the lobby from other pools
    _.each(lobby, function(user) {
        var userId = (typeof user === 'string') ? user: user.id;
        _.each(otherPools, function(pool) {
            pool.remove(userId);
        });
    });

    // add lobby into this pool
    this.add(lobby);
};

PoolLobbies.prototype.getByUser = function(userId) {
    return _.chain(this.lobbies)
        .find(function(lobby) {
            return _.where(lobby, {id: userId});
        })
        .value();
};

module.exports = PoolLobbies;
