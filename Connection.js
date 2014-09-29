var _ = require('lodash');
var uuid = require('node-uuid');

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

Connection.prototype = Object.create(null);
Connection.prototype.constructor = Connection;

Connection.prototype.close = function() {
    return _.remove(allConnections, {id: this.id});
};

module.exports = Connection;
