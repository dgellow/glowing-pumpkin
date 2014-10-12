var _ = require('lodash');

var helpers = require('./helpers');
var condHasAttr = helpers.condHasAttr;
var wrapText = helpers.wrapText;
var stringify = helpers.stringify;

var User = require('./User');
var Connection = require('./Connection');

var actions = {
    'authenticate:user': handleAuthentication
};

function isAuthenticated(connection) {
    return !!connection.user;
}

function process(connection, data) {
    if (_.has(actions, data.action)) {
        actions[data.action](connection, data);
    } else {
        connection.socket.write(stringify({
            status: 'error',
            message: 'User should be authenticated to make an action'
        }));
    }
}

function handleAuthentication(connection, data) {
    // check if user is already connected
    var connByUser = !Connection.getByUser(data.value);
    if (connByUser) {
        doesUserExist(connection, data, authenticate, createUser);
    } else {
        connection.socket.write(stringify({
            status: 'error',
            message: 'User already connected in another session'
        }));
    }
}

function doesUserExist(connection, data, fnTrue, fnFalse) {
    User.exists(data.value.id)
        .then(function(hasBeenFound) {
            return (hasBeenFound) ?
                fnTrue(connection, data):
                fnFalse(connection, data);
        })
        .catch(function(err) {
            connection.socket.write(stringify({
                status: 'error',
                message: err.name + ': ' + err.message
            }));
        }).done();
}

function createUser(connection, data) {
    User.create(data.value.id, data.value.name)
        .then(function(user) {
            connection.user = user;
            connection.socket.write(stringify({
                status: 'success'
            }));
        })
        .catch(function(err) {
            connection.socket.write(stringify({
                status: 'error',
                message: err.name + ': ' + err.message
            }));
        }).done();
}

function authenticate(connection, data) {
    User.getById(data.value.id)
        .then(function(user) {
            connection.user = user;
            connection.socket.write(stringify({
                status: 'success'
            }));
        })
        .catch(function(err) {
            if (err.message === 'missing') {
                connection.socket.write(stringify({
                    status: 'error',
                    message: 'Error: User with id [' + data.value.id.toString() + '] not found'
                }));
            } else {
                connection.socket.write(stringify({
                    status: 'error',
                    message: err.name.toString() + ': ' + err.message.toString()
                }));
            }
        }).done();
}

module.exports = Object.create({
    isAuthenticated: isAuthenticated,
    process: process,
    actions: actions
});
