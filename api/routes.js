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
    //timeout: 1000,
    headers: {'authorization': auth}
});

const OCAST_SERIES_PATH = '/api/series'
const OCAST_VIDEOS_PATH = '/api/events'
    


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
                const msg = error.message
                res.json({ message: 'Error', msg })
            });
    })
    


    /*
        // Input:
        [
            {
                "identifier": "a91f1fff-e758-4fde-b48c-0e2d338b1115",
                "creator": "University of Helsinki Unitube Administrator",
                "presenter": [],
                "created": "2019-02-01T11:13:30Z",
                "subjects": [
                "Toimintaelokuva"
                ],
                "start": "2019-02-01T11:13:30Z",
                "description": "",
                "title": "Moodle-testi 2",
                "processing_state": "SUCCEEDED",
                "duration": 0,
                "archive_version": 3,
                "contributor": [],
                "has_previews": true,
                "location": "",
                "publication_status": [
                "internal",
                "engage-player",
                "api"
                ]
            }
        ]

        // Output:
        [
            { 
                "identifier": "a91f1fff-e758-4fde-b48c-0e2d338b1115", 
                "title": "Moodle-testi 2", 
                "duration": 0, 
                "creator": "University of Helsinki Unitube Administrator" 
            }
        ]
    */
    const eventsForClient = (ocResponseData) => {
        
        if(!ocResponseData){
            return [];
        }

        const eventArray = []
        ocResponseData.forEach(event => {
            eventArray.push({
                "identifier": event.identifier,
                "title": event.title,
                "duration": event.duration,
                "creator": event.creator
            })
        });
        return eventArray;
    }

    
    // "all" events AKA videos from ocast
    app.route('/events').get((req, res) => {

        opencastBase.get(OCAST_VIDEOS_PATH)
            .then(function (response) {        
                res.send(eventsForClient(response.data))
            })
            .catch(function (error) {
                const msg = error.message
                res.json({ message: 'Error', msg })
            });
        })
};