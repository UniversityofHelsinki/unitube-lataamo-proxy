'use strict';
require('dotenv').config();
const api = require('./apiInfo');
const eventsService = require('../service/eventsService');
const seriesService = require('../service/seriesService');
const apiService = require('../service/apiService');
const userService = require('../service/userService');

module.exports = function(app) {
    app.get('/', api.apiInfo);

    app.get("/user", (req, res) => {
        res.json(req.user);
    });

    // "user" own getSeriesForApiUser from ocast
    app.get('/userSeries', async (req, res) => {
        try {
            const apiUser = await userService.getApiUser();
            const series = await apiService.getSeriesForApiUser(apiUser);
            const userSeries = seriesService.getUserSeries(series, req.user.eppn);
            res.json(userSeries);
        } catch(error) {
            res.status(500)
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

    // "user" own events AKA videos from ocast
    app.get('/userEvents', async (req, res) => {
        try {
            const apiUser = await userService.getApiUser();
            const userSeries = await apiService.getSeriesForApiUser(apiUser);
            const seriesIdentifiers = seriesService.getSeriesIdentifiers(userSeries, req.user.eppn);
            const allEvents = await eventsService.getAllEvents(seriesIdentifiers);
            const concatenatedArray = eventsService.concatenateArray(allEvents);
            res.json(eventsService.filterEventsForClient(concatenatedArray));
        } catch (error) {          
            res.status(500)         
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });
};