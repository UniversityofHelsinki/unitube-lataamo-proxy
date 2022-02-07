const asyncRedis = require("async-redis");
const client = asyncRedis.createClient({
    url: 'redis://redis'
});

module.exports = client;
