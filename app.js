const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./api/routes');

const app = express();
const port = 3000;
const router = express.Router();

routes(router);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api', router);

app.get('/', (req, res) => {
    res.send({ status: 200, message: 'Alive' })
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});    
