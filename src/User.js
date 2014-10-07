var _ = require('lodash');
var Q = require('q');

var db = require('./Database');
var dbUsers = new db('users');

var _users = require('../data/data_test.json').Users;
var allUsers;

var User = function(id, name) {
    this.id = id;
    this.name = name;
};

User.create = function(id, name) {
    return dbUsers.insert({id: id, name: name}, id)
        .then(function(user) {
            return new User(user.id, name);
        });
};

User.getById = function(id) {
    return dbUsers.getById(id)
        .then(function(user) {
            return new User(user.id, user.name);
        });
};

User.getAll = function() {
    return dbUsers.getAll().then(function(users) {
        return _.map(users, function(user) {
            return new User(user.id, user.name);
        });
    });
};

User.prototype = Object.create(null);
User.prototype.constructor = User;

User.prototype.save = function() {
    return dbUsers.save(this);
};

module.exports = User;
