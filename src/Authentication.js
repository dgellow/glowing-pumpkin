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
    if (_.has(actions, data.action)) {
        actions[data.action](connection, data);
    } else {
        connection.socket.write(stringify({
            status: 'error',
            message: 'User should be authenticated to make an action'
        }));
    }
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
    handleAuthentication: handleAuthentication,
    actions: actions
});
