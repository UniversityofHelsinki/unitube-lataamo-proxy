'use strict';
require('dotenv').config();
const api = require('./apiInfo');
const eventsService = require('../service/eventsService');
const seriesService = require('../service/seriesService');
const apiService = require('../service/apiService');

module.exports = function(app) {
    app.get('/', api.apiInfo);

    app.get("/user", (req, res) => {
        res.json(req.user);
    });

    // "all" series from ocast
    app.get('/series', async (req, res) => {
        try {
            const allSeries = await apiService.allSeries();
            res.json(allSeries);
        } catch(error) {
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

    // "user" own events AKA videos from ocast
    app.get('/userEvents', async (req, res) => {
        try {
            const userSeries = await apiService.series();
            const seriesIdentifiers = seriesService.getSeriesIdentifiers(userSeries, req.user.eppn);
            const allEvents = await eventsService.getAllEvents(seriesIdentifiers);
            const concatenatedArray = eventsService.concatenateArray(allEvents);
            res.json(eventsService.filterEventsForClient(concatenatedArray));
        } catch (error) {
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

    // "all" events AKA videos from ocast
    app.get('/events', async (req, res) => {
        try {
            const allEvents = await apiService.allEvents();
            res.json(eventsService.filterEventsForClient(allEvents));
        } catch (error) {
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

};