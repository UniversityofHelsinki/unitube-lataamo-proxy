const asyncRedis = require("async-redis");
const client = asyncRedis.createClient();

module.exports = client;