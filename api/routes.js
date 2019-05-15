'use strict';
require('dotenv').config();
const proxy = require('express-http-proxy');
const axios = require('axios'); // https://www.npmjs.com/package/axios


const host = process.env.LATAAMO_OPENCAST_HOST;
const username = process.env.LATAAMO_OPENCAST_USER;
const password = process.env.LATAAMO_OPENCAST_PASS;
const userpass = Buffer.from(`${username}:${password}`).toString('base64');
const auth = `Basic ${userpass}`;


// instance of axios with a custom config.
// ocast base url and authorization header
const opencastBase = axios.create({
    baseURL: host,
    timeout: 1000,
    headers: {'authorization': auth}
});

const OCAST_SERIES_PATH = '/api/series'
const OCAST_VIDEOS_PATH = '/api/events'  // videos == events?
    


module.exports = function(app) {
    let api   = require('./apiController');
    app.route('/')
        .get(api.apiInfo);


    // "all" series from ocast
    app.route('/series').get((req, res) => {
       
        opencastBase.get(OCAST_SERIES_PATH)
          .then(function (response) {
            res.send(response.data)
          })
          .catch(function (error) {
            console.log(error);
          });
    })  
    
    
    // "all" events AKA videos from ocast
    app.route('/events').get((req, res) => {

        opencastBase.get(OCAST_VIDEOS_PATH)
          .then(function (response) {
            res.send(response.data)
          })
          .catch(function (error) {
            console.log(error);
          });
    }) 
};