const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const security = require('./config/security');
const passport = require('passport');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const logger = require('./config/winstonLogger');
const compression = require('compression');

const app = express();
const port = 3000;
const host = '127.0.0.1';
const router = express.Router();
const LOG_FILE_NAME = 'access.log';
const LOG_DIRECTORY = __dirname;

const xss = require('xss-clean');


const accessLogStream = fs.createWriteStream(
    path.join(LOG_DIRECTORY + '/logs', LOG_FILE_NAME), { flags: 'a' })

routes(router);
app.use(morgan('combined', { stream: accessLogStream }))
app.use(cors());
app.use(compression());
security.shibbolethAuthentication(app, passport);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(xss());
app.use('/api', router);


app.listen(port, host,  () => {
    logger.info(`lataamo proxy is listening on port ${port}!`);
});

// for the tests
module.exports = app;
