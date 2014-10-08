var _ = require('lodash');

var Pool = require('./Pool');

var PoolGames = function() {
    Pool.call(this, 'games');
    this.games = [];
};

PoolGames.prototype = Object.create(Pool.prototype);
PoolGames.prototype.constructor = PoolGames;

PoolGames.prototype.add = function(game) {
    return this.games.push(game);
};

PoolGames.prototype.remove = function(userId) {
    return _.remove(this.games, function(game) {
        return _.contains(lobby, game);
    });
};

PoolGames.prototype.push = function(game) {
    var otherPools = this.selectOtherPools();

    // remove each user in the game from other pools
    _.each(game.opponents, function(user) {
        var userId = (typeof user === 'string') ? user: user.id;
        _.each(otherPools, function(pool) {
            pool.remove(userId);
        });
    });

    // add user into this pool
    this.add(game);
};

module.exports = PoolGames;
