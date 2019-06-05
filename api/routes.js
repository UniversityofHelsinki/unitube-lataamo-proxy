'use strict';
require('dotenv').config();
const api   = require('./apiController');
const eventsService = require('../service/eventsService');
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
    //timeout: 1000,
    headers: {'authorization': auth}
});

const OCAST_SERIES_PATH = '/api/series'
const OCAST_VIDEOS_PATH = '/api/events'

module.exports = function(app) {
    app.get('/', api.apiInfo);

    app.get("/user", (req, res) => {
        res.json(req.user);
    });

    // "all" series from ocast
    app.get('/series', async (req, res) => {
        try {
            const response = await opencastBase.get(OCAST_SERIES_PATH);
            res.json(response.data);
        } catch(error) {
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });


    // "all" events AKA videos from ocast
    app.get('/events', async (req, res) => {
        try {
            const response = await opencastBase.get(OCAST_VIDEOS_PATH);
            res.json(eventsService.filterEventsForClient(response.data));
        } catch (error) {
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

};