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
        return _.findWhere(game.players, {id: user.id});
    });
};

PoolGames.prototype.removeUser = function(user) {
    _.chain(this.games)
        .filter(function(game) { return game.gameState.isRunning; })
        .each(function(game) {
            var u = _.find(game.players, function(player) {
                return player.id === user.id;
            });
            if(u) {
                game.gameState.isRunning = false;
                game.gameState.reason = 'A player leave the fight';
                game.gameState.updateTimestamp = new Date().getTime();
            }
        });
};

PoolGames.prototype.push = function(game) {
    var otherPools = this.selectOtherPools();

    // remove each user in the game from other pools
    _.each(game.players, function(user) {
        _.each(otherPools, function(pool) {
            pool.remove(user);
        });
    });

    // add user into this pool
    this.add(game);
};

PoolGames.prototype.getByUser = function(user) {
    var result = _.find(this.games, function(game){
        return !_.chain(game.players)
            .where({id: user.id })
            .isEmpty()
            .value();
    });
    return result;
};


module.exports = PoolGames;
