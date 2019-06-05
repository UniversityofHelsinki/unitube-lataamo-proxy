'use strict';
require('dotenv').config();
const api   = require('./apiInfo');
const eventsService = require('../service/eventsService');
const security = require('../config/security');
const proxy = require('express-http-proxy');


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
            const response = await security.opencastBase.get(OCAST_SERIES_PATH);
            res.json(response.data);
        } catch(error) {
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });


    // "all" events AKA videos from ocast
    app.get('/events', async (req, res) => {
        try {
            const response = await security.opencastBase.get(OCAST_VIDEOS_PATH);
            res.json(eventsService.filterEventsForClient(response.data));
        } catch (error) {
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

};