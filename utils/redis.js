const asyncRedis = require("async-redis");
const client = asyncRedis.createClient({
    url: process.env.REDIS_URL
});

module.exports = client;
