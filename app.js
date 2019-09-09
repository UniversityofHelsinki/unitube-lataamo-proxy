const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const security = require('./config/security');
const passport = require('passport');
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
// api docs with swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;
const host = '127.0.0.1';
const router = express.Router();
const LOG_FILE_NAME = 'access.log'
const LOG_DIRECTORY = __dirname

const accessLogStream = fs.createWriteStream(
    path.join(LOG_DIRECTORY, LOG_FILE_NAME), { flags: 'a' })

// https://swagger.io/docs/specification/2-0/basic-structure/
const options = {
    swaggerDefinition: {
        info: {
        title: 'Unitube lataamo API',
        version: '0.0.1',
        description: 'Unitube lataamo proxy API documentation',
        },
    },
    // List of files to be processed.
    apis: ['./api/routes.js'],
    };
    
    const apiSpecs = swaggerJsdoc(options);    

routes(router);
app.use(morgan('combined', { stream: accessLogStream }))
app.use(cors());

security.shibbolethAuthentication(app, passport);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api', router);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpecs));


app.listen(port, host,  () => {
    console.log(`Example app listening on port ${port}!`)
});   

// for the tests
module.exports = app;
