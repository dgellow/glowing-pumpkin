var _ = require('lodash');

var Pool = require('./Pool');

var PoolSearch = function() {
    Pool.call(this, 'search');
    this.users = [];
};

PoolSearch.prototype = Object.create(Pool.prototype);
PoolSearch.prototype.constructor = PoolSearch;

PoolSearch.prototype.add = function(user) {
    return this.users.push(user);
};

PoolSearch.prototype.remove = function(user) {
    return _.remove(this.users, function(u) {
        return u.id === user.id;
    });
};

PoolSearch.prototype.push = function(user) {
    // remove user from other pools
    _.each(this.selectOtherPools(), function(pool) {
        pool.remove(user);
    });

    // add user into this pool
    this.add(user);
};

module.exports = PoolSearch;
