var _ = require('lodash');
var util = require('util');

var db = require('./Database');
var dbCharacters = new db('characters');

var modifiers = null;
var allCharacters = [];

var Character = function(obj) {
    this.id = obj.id || obj._id;
    this.name = obj.name;
    this.type = obj.type;
};

Character.getAll = function() {
    return allCharacters;
};

Character.getById = function(characterId) {
    return _.findWhere(allCharacters, {id: characterId});
};

Character.getModifier = function(sourceId, targetId) {
    var sourceCharacter = Character.getById(sourceId);
    var targetCharacter = Character.getById(targetId);

    if (sourceCharacter && targetCharacter) {
        return modifiers[sourceCharacter.type][targetCharacter.type];
    } else {
        throw new Error(
            'Cannot find one of those characters: ' +
                util.inspect([sourceCharacter, targetCharacter])
        );
    }
};

function loadCharacters() {
    dbCharacters.getAll()
        .then(function(results) {
            allCharacters = _.map(results, function(c) {
                return new Character(c);
            });
        })
        .catch(function(err) {
            throw err;
        }).done();
}

function loadModifiers() {
    dbCharacters.getById('rules_modifiers')
        .then(function(doc) {
            modifiers = doc;
        })
        .catch(function(err) {
            throw err;
        }).done();
}

Character.load = function() {
    if (allCharacters.length === 0) {
        loadCharacters();
    }

    if (modifiers === null) {
        loadModifiers();
    }
};

Character.prototype = Object.create(null);
Character.constructor.prototype = Character;

module.exports = Character;
