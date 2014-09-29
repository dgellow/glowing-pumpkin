var _ = require('lodash');
var uuid = require('node-uuid');

var allPools = [];

var Pool = function(label) {
    this.id = uuid.v4();
    this.label = label || '';
    this.users = [];
    allPools.push(this);
};

Pool.getAll = function() {
    return allPools;
};

Pool.getByLabel = function(label) {
    return _.findWhere(allPools, {label: label});
};

Pool.prototype = Object.create(null);
Pool.prototype.constructor = Pool;

Pool.prototype.add = function(userId) {
    return this.users.push(userId);
};

Pool.prototype.remove = function(user) {
    var userId = (typeof user === 'number') ? user : user.id;
    return _.remove(this.users, userId);
};

Pool.prototype.push = function(user) {
    var userId = (typeof user === 'number') ? user : user.id;

    var otherPools = _.reject(allPools, function(pool) {
        return pool.id === this.id;
    });

    // remove user from other pools
    _.each(otherPools, function(pool) {
        pool.remove(userId);
    });

    // add user into this pool
    this.add(userId);
};

module.exports = Pool;
