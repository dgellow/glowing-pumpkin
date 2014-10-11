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

PoolGames.prototype.remove = function(user) {
    return _.remove(this.games, function(game) {
        // seems not correct to me, should remove lobby containing user, not game
        // TOCHECK
        return _.findWhere(game.players, {id: user.id});
    });
};

PoolGames.prototype.push = function(game) {
    var otherPools = this.selectOtherPools();

    // remove each user in the game from other pools
    _.each(game.opponents, function(user) {
        _.each(otherPools, function(pool) {
            pool.remove(user);
        });
    });

    // add user into this pool
    this.add(game);
};

module.exports = PoolGames;
