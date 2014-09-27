var _ = require('lodash');
var net = require('net');

var users = require('./data_test.json').Users;

var poolSearchingMatch = [];
var poolGames = [];
var allPools = [poolSearchingMatch, poolGames];

var actions = {
    'search:match': searchMatch,
};

function log(str) {
    str = str || '';
    console.log(wrapText(str));
}

function wrapText(str) {
    return Date.now() + ': ' + str + '\r\n';
}

function parse(data) {
    var jsonData;
    try {
        jsonData = parse(data);
    } catch(err) {
        console.log('!! Exception: ' + JSON.stringify(err));
        jsonData = {};
    } finally {
        return jsonData;
    }
}

function isAllowed(data) {
    var jsonData = parse(data);
    return (jsonData &&
            jsonData.user &&
            _.findWhere(users, {name: jsonData.user})) ?
        jsonData :
        false;
}

function moveToPool(userId, destPoolId) {
    // select every pools but the targeted one
    var poolsToClean = _.reject(allPools, function(pool) {
        return pool.uuid === destPoolId;
    });

    // remove user from other pools
    _.each(poolsToClean, function(pool) {
        pool = _.without(pool, userId);
    });

    // add user to destPool
    var destPool = _.findWhere(allPools, {uuid: destPoolId});
    destPool.push(userId);
}

function route(data, socket) {
    if (!_.has(data, 'action')) {
        socket.write('Error: Received object has no [action] attribute');
        return;
    }

    actions[data.action](data);
}

function searchMatch(data) {
    if ((user = _.findWhere(users, {name: data.user}))) {
        poolSearchingMatch.push(user.uuid);
    } else {
        log('Error: user [' + data.user + '] cannot be found');
    }
}

function main(socket) {
    socket.on('data', function(data) {
        if ((jsonData = isAllowed(data))) {
            route(jsonData, socket);
        }
        log('Users: ' + JSON.stringify(users));
        log('Pools: ' + JSON.stringify(allPools));
    });

    socket.on('end', function() {
        log('server disconnected');
    });

    log('server connected');
    socket.write(wrapText('hello'));
}

var server = net.createServer(main);
server.listen(1337, function() {
    log('server bound');
});
