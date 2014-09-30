var net = require('net');
var util = require('util');
var uuid = require('node-uuid');

var helpers = require('./src/helpers');
var log = helpers.log;
var parse = helpers.parse;

var User = require('./src/User');

var clientId = uuid.v4();

// Helpers
function printClientLog(str) {
    log('client>>LOG   >> ' + str);
}

function printClientSocket(str) {
    log('client>>SOCKET>> ' + str);
}

function printServerSocket(str) {
    log('server<<SOCKET<< ' + str);
}

function clientWrite(obj) {
    var str = JSON.stringify(obj);
    printClientSocket(str);
    client.write(str);
}

function delay(duration, obj, fnNames) {
    fnNames.forEach(function(fnName, index) {
        setTimeout(function() {
            obj[fnName]();
        }, index * duration);
    });
}

// connect to the server
var client = net.connect({port: 1337, host: 'localhost'}, function() {
    printClientLog('client connected');

    var steps = ['authenticate',
                 'searchForAGame',
                 'stopSearch',
                 'close'];

    delay(2000, goodClient, steps);
});

client.on('data', function(data) {
    printServerSocket(util.inspect(parse(data)));
});

client.on('end', function() {
    printClientLog('client disconnected');
});

client.on('error', function(err) {
    debugger;
});

// good process, send correct content,
// should works as described by fns name
var goodClient = {
    authenticate: function () {
        var userId = uuid.v4();
        var obj = {timestamp: Date.now(),
                   action: 'create:user',
                   value: {id: userId, name: 'roger'}};
        clientWrite(obj);
    },

    searchForAGame: function () {
        var obj = {timestamp: Date.now(),
                   action: 'initiate:search:game'};
        clientWrite(obj);
    },

    stopSearch: function () {
        var obj = {timestamp: Date.now(),
                   action: 'interrupt:search:game'};
        clientWrite(obj);
    },

    close: function () {
        client.end();
    }
};

// wrong process, send bad content,
// should not work as described by fns name.
// Bad behaviours should be noticed by the server.
var badClient = {
    authenticate: function () {
        var userId = uuid.v4();
        var obj = {timestamp: Date.now(),
                   // user does not exist (normally),
                   // so an error should be returned (user is not found
                   // or something similar)
                   action: 'authenticate:user',
                   value: {id: userId, name: 'roger'}};
        clientWrite(obj);

        // then correct authentication to run next fns
        goodClient.authenticate();
    },

    searchForAGame: function () {
        var obj = {timestamp: Date.now(),
                   action: 'initiate:search:game'};
        clientWrite(obj);
    },

    stopSearch: function () {
        var obj = {timestamp: Date.now(),
                   action: 'interrupt:search:game'};
        clientWrite(obj);
    },

    close: function () {
        client.end();
    }
};
