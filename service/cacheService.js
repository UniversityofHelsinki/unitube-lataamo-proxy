const cache = require('../utils/node-cache');

exports.updateCache = (key, value) => cache.set(key, value);

exports.get = (key) => cache.get(key);

exports.getAll = (keys) => cache.mget(keys);

exports.delete = (key) => cache.del(key);

exports.removeFromCache = (key) => {
    const cacheKey = this.get(key);
    if (cacheKey !== undefined) {
        this.delete(key);
    }
};

exports.getKeys = () => cache.keys();

exports.flushAll = () => cache.flushAll();

exports.has = (key) => cache.has( key );