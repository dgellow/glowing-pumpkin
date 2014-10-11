var _ = require('lodash');
var Q = require('q');

var db = require('./Database');
var dbUsers = new db('users');

var _users = require('../data/data_test.json').Users;
var allUsers;

function dice(faces) {
    return Math.ceil(Math.random() * faces);
}

var User = function(id, name) {
    this.id = id;
    this.name = name;

    this.level = 1;

    this.currencies = {
        candies: 110
    };

    // player stats
    this.attack = 3 * dice(6);
    this.speed = 3 * dice(6);
    this.defense = 3 * dice(6);
    this.hp = 3 + dice(6);
};

User.create = function(id, name) {
    return dbUsers.insert(new User(id, name), id)
        .then(function(user) {
            return user;
        });
};

User.exists = function(id) {
    return dbUsers.exists(id);
};

User.getById = function(id) {
    return dbUsers.getById(id)
        .then(function(user) {
            return user;
        });
};

User.save = function(user) {
    return dbUsers.save(user);
};

User.prototype = Object.create(null);
User.prototype.constructor = User;

module.exports = User;
