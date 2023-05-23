const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const security = require('./config/security');
const passport = require('passport');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const logger = require('./config/winstonLogger');
const busboy = require('connect-busboy');  //https://github.com/mscdex/connect-busboy
const compression = require('compression');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const redisClient = require('./utils/redis');
const database = require("./service/database");

const app = express();
app.use(helmet());
const router = express.Router();
const port = 3000;
const host = '127.0.0.1';
const LOG_FILE_NAME = 'access.log';
const LOG_DIRECTORY = __dirname;

const accessLogStream = fs.createWriteStream(
    path.join(LOG_DIRECTORY + '/logs', LOG_FILE_NAME), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors());
app.use(compression());
app.use(cookieParser());
security.shibbolethAuthentication(app, passport);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(xss());


database.query('SELECT NOW()', (err, res) => {
    console.log(err ? "errors: " + err : 'Postgres client connected ' , res.rows[0]);
});

app.use('/api', router);

redisClient.on('connect', function() {
    console.log('Redis client connected');
});

redisClient.on('error', function (err) {
    console.log('Something went wrong ' + err);
});

// busboy middle-ware
router.use(busboy({
    highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
}));


app.use('/api', router);
routes(router);

const server = app.listen(port, host,  () => {
    logger.info(`lataamo proxy is listening on port ${port}!`);
});

server.requestTimeout = 0;

server.headersTimeout = 0;

// for the tests
module.exports = app;
