var _ = require('lodash');
var uuid = require('node-uuid');

var allPools = [];

var Pool = function(label) {
    this.id = uuid.v4();
    this.label = label || '';
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

Pool.prototype.selectOtherPools = function() {
    return _.reject(allPools, function(pool) {
        return pool.id === this.id;
    });
};

Pool.prototype.add = function() {
    throw new Error('Pool.add method should be overrided');
};

Pool.prototype.remove = function() {
    throw new Error('Pool.remove method should be overrided');
};

Pool.prototype.push = function() {
    throw new Error('Pool.push method should be overrided');
};

module.exports = Pool;
