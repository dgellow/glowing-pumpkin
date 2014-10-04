var _ = require('lodash');

var helpers = require('./helpers');
var condHasAttr = helpers.condHasAttr;
var wrapText = helpers.wrapText;
var stringify = helpers.stringify;

var User = require('./User');

var actions = {
    'authenticate:user': authenticate,
    'create:user': createUser
};

function isAuthenticated(connection) {
    return !!connection.user;
}

function handleAuthentication(connection, data) {
    return condHasAttr(connection, data, ['action', 'value'], function(conn, data) {
        if (_.has(actions, data.action)) {
            actions[data.action](conn, data);
        } else {
            conn.socket.write(stringify({
                status: 'error',
                message: 'User should be authenticated to make an action'
            }));
        }
    });
}

function createUser(connection, data) {
    if (data.value.id && data.value.name) {
        connection.user = User.create(data.value.id, data.value.name);

        connection.socket.write(stringify({
            status: 'success'
        }));
    } else {
        connection.socket.write(stringify({
            status: 'error',
            message: 'Error: Value should have non-empty [id, name] attributes'
        }));
    }
}

function authenticate(connection, data) {
    var user = User.getById(data.value.id);
    if (user) {
        connection.user = user;

        connection.socket.write(stringify({
            status: 'success'
        }));
    } else {
        connection.socket.write(stringify({
            status: 'error',
            message: 'Error: User with id [' + data.value.id + '] not found'
        }));
    }
}

module.exports = Object.create({
    isAuthenticated: isAuthenticated,
    handleAuthentication: handleAuthentication,
    actions: actions
});
