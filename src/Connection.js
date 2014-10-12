var _ = require('lodash');
var uuid = require('node-uuid');

var helpers = require('./helpers');
var stringify = helpers.stringify;

var Pool = require('./Pool');

var allConnections = [];

var Connection = function(socket) {
    this.id = uuid.v4();
    this.socket = socket;
    this.user = null;

    allConnections.push(this);
};

Connection.getAll = function() {
    return allConnections;
};

Connection.getById = function(id) {
    return _.findWhere(allConnections, {id: id});
};

Connection.getByUser = function(user) {
    var result = _.filter(allConnections, function(c) {
        return c.user && (c.user.id === user.id);
    });
    return _.first(result);
};

Connection.notifyUser = function(status, obj, user, fn) {
    var c = Connection.getByUser(user);
    if (c) {
        c.socket.write(stringify(_.extend({ status: status }, obj )));
    }
    if (fn && (typeof fn === 'function')) {
        fn(status, obj, user);
    }
};

Connection.notifySuccess = function(v, user) {
    Connection.notifyUser('success', { value: v }, user);
};

Connection.notifyError = function(m, user) {
    Connection.notifyUser('error', { message: m }, user);
};

Connection.prototype = Object.create(null);
Connection.prototype.constructor = Connection;

Connection.prototype.close = function() {
    // remove the user from every pools
    if (this.user) {
        _.each(Pool.getAll(), function(p) {
            p.removeUser(this.user);
        }, this);
    }

    // remove the Connection object
    _.remove(allConnections, {id: this.id});
};

module.exports = Connection;
