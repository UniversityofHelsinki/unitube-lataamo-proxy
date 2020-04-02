const client = require('../utils/redis');

exports.updateCache = async (key, value) => await client.set(key, value);

exports.get = async (key) => await client.get(key);

exports.getAll = (keys) => client.mget(keys);

exports.delete = async (key) => await client.del(key);

exports.removeFromCache = async (key) => {
    const cacheKey = await this.get(key);
    if (cacheKey !== undefined) {
        await this.delete(key);
    }
};

exports.getKeys = async () => await client.keys('*');