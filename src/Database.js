var _ = require('lodash');
var Q = require('q');

var dbConfig = require('../data/databases_config');
var nano = require('nano')('http://localhost:5984');

function CouchDBException(message) {
    this.message = message;
    this.name = "CouchDBException";
}

// Create databases if they do not exist
function dbCreate(name) {
    nano.db.create(name, function(err) {
        if (err && err.error !== 'file_exists') {
            throw new CouchDBException(err.reason);
        }
    });
}

_.keys(dbConfig).forEach(dbCreate);


// Create views if they do not exist
function viewCreate(design, dbName) {
    var doc = {_id: '_design/' + dbName, views: design.views};
    nano.use(dbName).insert(doc, function(err) {
        if (err && err.error !== 'conflict') {
            throw new CouchDBException(err.reason);
        }
    });
}

_.forIn(dbConfig, viewCreate);


// Define a Database type
var Database = function(dbName) {
    this.name = dbName;
    this.scope = nano.db.use(dbName);
};

Database.prototype = Object.create(null);
Database.prototype.constructor = Database;

Database.prototype.getAll = function() {
    var deferred = Q.defer();
    this.scope.list(function(err, results) {
        if (err) {
            deferred.reject(new CouchDBException(err.reason));
        } else {
            deferred.resolve(results);
        }
    });
    return deferred.promise;
};

Database.prototype.getById = function(documentId) {
    var deferred = Q.defer();
    this.scope.get(documentId, function(err, results) {
        if (err) {
            deferred.reject(new CouchDBException(err.reason));
        } else {
            deferred.resolve(results);
        }
    });
    return deferred.promise;
};

Database.prototype.insert = function(document, documentId) {
    var deferred = Q.defer();
    this.scope.insert(document, documentId, function(err, doc) {
        if (err) {
            deferred.reject(new CouchDBException(err.reason));
        } else {
            deferred.resolve(doc);
        }
    });
    return deferred.promise;
};

Database.prototype.update = function(newDocument, documentId) {
    return this.getById(documentId)
        .then(function(document) {
            var o = _.clone(newDocument);
            delete o.id;

            // specify last revision number to avoid conflicts
            o._rev = document._rev;

            return this.insert(o, documentId);
        });

};

// insert or update if it already exists
Database.prototype.save = function(obj) {
    if (!obj.id) {
        return Q.reject('Given object has no id attribute');
    }

    var documentId = obj.id;
    return this.insert(obj, documentId)
        .catch(function(err) {
            if (err.reason === 'conflict') {
                this.update(obj, documentId);
            } else {
                throw err;
            }
        });
};

module.exports = Database;
