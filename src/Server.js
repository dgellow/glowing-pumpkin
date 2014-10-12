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

var Characters = require('./Characters');
var User = require('./User');
var Connection = require('./Connection');
var Pool = require('./Pool');
var Auth = require('./Authentication');
var Router = require('./Route');

var PoolSearch = require('./PoolSearch');

// Instanciate pools
var PoolSearch = new (require('./PoolSearch'))();
var PoolLobbies = new (require('./PoolLobbies'))();
var PoolGames = new (require('./PoolGames'))();

var matchMaking = require('./MatchMaking');
var lobbyToGame = require('./LobbyToGame');
var gameLogic = require('./GameLogic');

// Main function, run everytime a connection has been initiated
function main(socket) {
    var connection = new Connection(socket);

    socket.on('data', function(rawData) {
        var jsonData = parse(rawData);

        if (!Auth.isAuthenticated(connection)) {
            Auth.process(connection, jsonData);
        } else {
            Router.route(connection, jsonData);
        }

        log('rawData: ' + rawData);
        log('Pools  : ' + util.inspect(Pool.getAll()));
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

        // Load characters
        Characters.load();

        // Run background tasks every 1s
        matchMaking(1000);
        lobbyToGame(1000);
        gameLogic(1000);
    } catch(err) {
        log('!! Exception: ' + util.inspect(err));
        delete this.tcpServer;
        throw err;
    }
};

module.exports = Server;
