var _ = require('lodash');

var Pool = require('./Pool');

var PoolSearch = function() {
    Pool.call(this, 'search');
    this.users = [];
};

PoolSearch.prototype = Object.create(Pool.prototype);
PoolSearch.prototype.constructor = PoolSearch;

PoolSearch.prototype.add = function(userId) {
    return this.users.push(userId);
};

PoolSearch.prototype.remove = function(userId) {
    return _.remove(this.users, function(user) {
        return user === userId;
    });
};

PoolSearch.prototype.push = function(user) {
    var userId = (typeof user === 'string') ? user: user.id;
    var otherPools = this.selectOtherPools();

    // remove user from other pools
    _.each(otherPools, function(pool) {
        pool.remove(userId);
    });

    // add user into this pool
    this.add(userId);
};

module.exports = PoolSearch;
