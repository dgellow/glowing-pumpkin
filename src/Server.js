var _ = require('lodash');
var net = require('net');
var uuid = require('node-uuid');
var util = require('util');

var helpers = require('./helpers');
var log = helpers.log;
var wrapText = helpers.wrapText;
var parse = helpers.parse;
var condHasAttr = helpers.condHasAttr;

var User = require('./User');
var Connection = require('./Connection');
var Pool = require('./Pool');

var poolSearchingGame = new Pool('searchGame');
var poolCurrentGames = new Pool('currentGames');
var poolLobbies = new Pool('lobbies');

var matchMaking = require('./MatchMaking');

var actions = {
    'initiate:search:game': initiateSearchGame,
    'interrupt:search:game': interruptSearchGame,
    'enter:lobby': enterLobby,
    'leave:lobby': leaveLobby,
    'enter:game': enterGame,
    'leave:game': leaveGame,
};


// Manage authentication and creation of new user
function isAuthenticated(connection) {
    return !!connection.user;
}

function handleAuthentication(data, connection) {
    return condHasAttr(connection, data, ['user', 'action'], function(data, conn) {
        return (data.action === 'new:user') ?
            createUser(data, conn) :
            authenticate(data, conn);
    });
}

function createUser(connection, data) {
    connection.user = User.create(data.user.id, data.user.name);
}

function authenticate(connection, data) {
    var user = User.getById(data.user.id);
    if (!user) {
        connection.socket.write(wrapText(
            'Error: User with id [' + data.user.id + '] not found'
        ));
    } else {
        connection.user = user;
        connection.socket.write(wrapText('User: ' + util.inspect(user)));
    }
}


// Routing, dispatch data received from a client between actions
function route(data, connection) {
    condHasAttr(connection, data, ['action'], function(_conn, data) {
        if (_.has(actions, data.action)) {
            actions[data.action](connection, data);
        } else {
            connection.socket.write(JSON.stringify({
                status: 'error',
                message: 'Error: The action ' +
                    util.inspect(data.action) +
                    ' is not managed'
            }) + '\r\n');
        }
    });
}


// Actions
function initiateSearchGame(conn, data) {
    poolSearchingGame.push(conn.user);
}

function interruptSearchGame(conn, data) {
    poolSearchingGame.remove(conn.user);
}

function enterLobby(conn, data) {
    poolLobbies.push(conn.user);
}

function leaveLobby(conn, data) {
    poolLobbies.remove(conn.user);
}

function enterGame(conn, data) {
    poolCurrentGames.push(conn.user);
}

function leaveGame(conn, data) {
    poolCurrentGames.remove(conn.user);
}


// Main function, run everytime a connection has been initiated
function main(socket) {
    var connection = new Connection(socket);

    socket.on('data', function(rawData) {
        var jsonData = parse(rawData);

        if (!isAuthenticated(connection)) {
            handleAuthentication(jsonData, connection);
        }

        if (isAuthenticated(connection)) {
            route(jsonData, connection);
        }

        log('Users: ' + util.inspect(User.getAll()));
        log('Pools: ' + util.inspect(Pool.getAll()));
        log('Sockets: ' + util.inspect(Connection.getAll()));
    });

    socket.on('end', function() {
        connection.close();
        log('server disconnected');
    });

    socket.write(wrapText('hello'));
}


var Server = function(port) {
    this.port = port || 1337;
};

Server.prototype = Object.create(null);
Server.prototype.constructor = Server;

Server.prototype.run = function() {
    try {
        // Run the server
        this.tcpServer = net.createServer(main);
        this.tcpServer.listen(this.port, function() {
            log('server bound');
        });

        // Run the matchmaking logic, every 1s
        matchMaking(1000);
    } catch(err) {
        log('!! Exception: ' + util.inspect(err));
        delete this.tcpServer;
    }
};

module.exports = Server;
