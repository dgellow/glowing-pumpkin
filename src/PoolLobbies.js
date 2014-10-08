var _ = require('lodash');

var Pool = require('./Pool');

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

// a lobby is an [] like object containing userIds
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

module.exports = PoolLobbies;
