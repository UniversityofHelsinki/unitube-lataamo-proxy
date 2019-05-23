const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const security = require('./config/security');
const passport = require('passport');

const app = express();
const port = 3000;
const host = '127.0.0.1';
const router = express.Router();

routes(router);
app.use(cors());

security.shibbolethAuthentication(app, passport);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api', router);


app.listen(port, host,  () => {
    console.log(`Example app listening on port ${port}!`)
});    
