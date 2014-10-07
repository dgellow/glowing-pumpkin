var _ = require('lodash');
var net = require('net');
var uuid = require('node-uuid');
var util = require('util');

var helpers = require('./helpers');
var log = helpers.log;
var wrapText = helpers.wrapText;
var parse = helpers.parse;
var stringify = helpers.stringify;
var condHasAttr = helpers.condHasAttr;

var Connection = require('./Connection');
var Pool = require('./Pool');
var Auth = require('./Authentication');
var Router = require('./Route');

var poolSearchingGame = new Pool('searchGame');
var poolCurrentGames = new Pool('currentGames');
var poolLobbies = new Pool('lobbies');

var matchMaking = require('./MatchMaking');

// Main function, run everytime a connection has been initiated
function main(socket) {
    var connection = new Connection(socket);
    socket.write(stringify({status: 'okay', value: 'connected'}));

    socket.on('data', function(rawData) {
        var jsonData = parse(rawData);

        if (!Auth.isAuthenticated(connection)) {
            Auth.handleAuthentication(connection, jsonData);
        } else {
            Router.route(connection, jsonData);
        }

        log('Users: ' + util.inspect(User.getAll()));
        log('Pools: ' + util.inspect(Pool.getAll()));
        log('Sockets: ' + util.inspect(Connection.getAll()));
    });

    socket.on('end', function() {
        connection.close();
        log('server disconnected');
    });
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
