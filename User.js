var _ = require('lodash');
var _users = require('./data_test.json').Users;
var allUsers;

var User = function(id, name) {
    this.id = id;
    this.name = name;
};

User.create = function(id, name) {
    var user = new User(id, name);
    allUsers.push(user);
    return user;
};

User.fetch = function(id) {
    return _.findWhere(_users, {id: id});
};

User.getAll = function() {
    return allUsers;
};

User.prototype = Object.create(null);
User.prototype.constructor = User;


allUsers = _.map(_users, function(user) {
    return new User(user.id, user.name);
});

module.exports = User;
