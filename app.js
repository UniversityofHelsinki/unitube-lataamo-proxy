const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;
const routes = require('./api/routes');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const router = express.Router();

routes(router);
app.use('/api', router);

app.get('/', (req, res) => res.send({ status: 200, message: 'Alive' }));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));