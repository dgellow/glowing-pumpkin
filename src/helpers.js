var _ = require('lodash');
var util = require('util');

// Helper functions
function log(str) {
    str = str || '';
    console.log(wrapText(str));
}

function wrapText(str) {
    return new Date().toString() + ': ' + str + '\r\n';
}

function parse(data) {
    var jsonData;
    try {
        jsonData = JSON.parse(data);
    } catch(err) {
        log('!! Exception: ' + util.inspect(err));
        jsonData = {};
    } finally {
        return jsonData;
    }
}

function stringify(obj) {
    var strData;
    try {
        strData = JSON.stringify(obj);
    } catch(err) {
        log('!! Exception: ' + util.inspect(err));
        strData = JSON.stringify({status: 'error', message: 'server exception '});
    } finally {
        return strData;
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
        connection.socket.write(stringify({
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
    stringify: stringify,
    condHasAttr: condHasAttr
};
