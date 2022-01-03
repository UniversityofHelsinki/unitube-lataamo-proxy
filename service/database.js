// Postgres client setup
const Pool = require("pg-pool");

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    ssl: process.env.SSL ? true : false,
    max: 10, // Pool max size
    idleTimeoutMillis: 1000 // Close idle clients after 1 second
});

module.exports.query = (text, values) => {
    return pool.query(text, values);
};
