var _ = require('lodash');
var util = require('util');

// Helper functions
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
        jsonData = JSON.parse(data);
    } catch(err) {
        console.log('!! Exception: ' + util.inspect(err));
        jsonData = {};
    } finally {
        return jsonData;
    }
}

function condHasAttr(connection, obj, attributes, fnTrue, fnFalse) {
    var hasEveryAttr = _.chain(attributes)
        .map(function(attr) {
            return _.has(obj, attr);
        })
        .every()
        .value();

    if (!hasEveryAttr) {
        connection.socket.write(JSON.stringify({
            status: 'error',
            message: 'Error: Received object has no ' +
                util.inspect(attributes) +
                ' attribute'
        }) + '\r\n');
        if (typeof fnFalse === 'function') {
            return fnFalse(connection, obj, attributes);
        }
    } else {
        return fnTrue(connection, obj, attributes);
    }
}

module.exports = {
    log: log,
    wrapText: wrapText,
    parse: parse,
    condHasAttr: condHasAttr
};
