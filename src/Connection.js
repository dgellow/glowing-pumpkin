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

Connection.getById = function(id) {
    return _.findWhere(allConnections, {id: id});
};

Connection.getByUser = function(user) {
    var userId = (typeof user === 'string') ? user : user.id;
    var result = _.filter(allConnections, function(c) {
        return c.user.id == userId;
    });
    return _.first(result);
};

Connection.prototype = Object.create(null);
Connection.prototype.constructor = Connection;

Connection.prototype.close = function() {
    return _.remove(allConnections, {id: this.id});
};

module.exports = Connection;
