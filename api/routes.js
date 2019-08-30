'use strict';
require('dotenv').config();
const api = require('./apiInfo');
const eventsService = require('../service/eventsService');
const seriesService = require('../service/seriesService');
const apiService = require('../service/apiService');
const userService = require('../service/userService');
const publicationService = require('../service/publicationService');
const busboy = require('connect-busboy');  //https://github.com/mscdex/connect-busboy
const path = require('path');   // Used for manipulation with path
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra


module.exports = function(app) {
    app.get('/', api.apiInfo);

    app.get("/user", (req, res) => {
        res.json(userService.getLoggedUser(req.user));
    });

    app.use(busboy({
        highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
    })); // Insert the busboy middle-ware

    const uploadPath = path.join(__dirname, 'uploads/'); // Register the upload path
    console.log('using uploadPath:', uploadPath);

    fs.ensureDir(uploadPath); // Make sure that he upload path exits


    // selected video metadata
    app.get("/event/:id", async (req, res) => {
       try {
           const event = await apiService.getEvent(req.params.id);
           const eventWithSerie = await eventsService.getEventWithSerie(event);
           const eventWithAcls = await eventsService.getEventAclsFromSerie(eventWithSerie);
           const eventWithVisibility = eventsService.calculateVisibilityProperty(eventWithAcls);
           const eventWithMetadata = await eventsService.getMetadataForEvent(eventWithVisibility);
           const eventWithMedia = await eventsService.getMediaForEvent(eventWithMetadata);
           const eventWithMediaFileMetadata = await eventsService.getMediaFileMetadataForEvent(eventWithMedia);
           const eventWithDuration = eventsService.getDurationFromMediaFileMetadataForEvent(eventWithMediaFileMetadata);
           console.log('eventWithDuration', eventWithDuration);
           res.json(eventWithDuration);
       } catch (error) {
           const msg = error.message
           res.json({ message: 'Error', msg });
       }
    });

    // selected video file url
    app.get("/video/:id", async (req, res) => {
        try {
            const publications = await apiService.getPublicationsForEvent(req.params.id);
            const filteredPublication = publicationService.filterApiChannelPublication(publications);
            const mediaUrl = publicationService.getMediaUrlFromPublication(req.params.id, filteredPublication);
            res.json(mediaUrl);
        } catch(error) {
            const msg = error.message
            res.json({ message: 'Error', msg });
        }
    });

    // "user" own getSeriesForApiUser from ocast
    app.get('/userSeries', async (req, res) => {
        try {
            const loggedUser = userService.getLoggedUser(req.user);
            const allSeries = await apiService.getAllSeries();
            const userSeries = seriesService.getUserSeries(allSeries, loggedUser);
            res.json(userSeries);
        } catch(error) {
            res.status(500)
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

    // "user" own events AKA videos from ocast
    app.get('/userVideos', async (req, res) => {
        try {
            const allSeries = await apiService.getAllSeries();
            const loggedUser = userService.getLoggedUser(req.user);
            const seriesIdentifiers = seriesService.getSeriesIdentifiers(allSeries, loggedUser);
            const allEvents = await eventsService.getAllEvents(seriesIdentifiers);
            const concatenatedEventsArray = eventsService.concatenateArray(allEvents);
            const allEventsWithMetaDatas = await eventsService.getAllEventsWithMetadatas(concatenatedEventsArray);
            const allEventsWithMedia = await eventsService.getEventsWithMedia(allEventsWithMetaDatas);
            const allEventsWithMediaFile = await eventsService.getAllEventsWithMediaFileMetadata(allEventsWithMedia);
            const allEventsWithAcls = await eventsService.getAllEventsWithAcls(allEventsWithMediaFile);
            res.json(eventsService.filterEventsForClient(allEventsWithAcls));
        } catch (error) {
            res.status(500)
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

    // handle video file with busboy
    app.post('/userVideos', async (req, res) => {
        try{
            req.pipe(req.busboy); // Pipe it trough busboy
            let startTime;

            req.busboy.on('file', (fieldname, file, filename) => {
                startTime = new Date()
                console.log(`Upload of '${filename}' started`);
                const filePathOnDisk = path.join(uploadPath, filename);

                // Create a write stream of the new file
                const fstream = fs.createWriteStream(filePathOnDisk);
                // Pipe it trough
                file.pipe(fstream);

                // On finish of the upload
                fstream.on('close', async () => {
                    let timeDiff = new Date() - startTime;
                    console.log('Loading time with busboy', timeDiff, 'milliseconds');

                    // TODO: resolve id for user's inbox series (LATAAMO-185)
                    const loggedUser = userService.getLoggedUser(req.user);
                    const allSeries = await apiService.getAllSeries();
                    const userSeries = seriesService.getUserSeries(allSeries, loggedUser);
                    const firstSerie = userSeries[0];
                    const response = await apiService.uploadVideo(filePathOnDisk, filename, firstSerie)

                    if (response.status == 201) {
                        deleteFile(filePathOnDisk);
                        res.status(200)
                        res.json({ message: `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)}`})
                    } else {
                        deleteFile(filePathOnDisk);
                        res.status(500)
                        res.json({ message: `${filename} failed.`})
                    }
                });
            });
        }catch(error){
            console.log('Err POST userVideos', error);
            res.status(500)
            res.json({ message: `${filename} failed ${error}.`})
        }
    });

    // clean after post
    function deleteFile(filename) {
        console.log('delete file from disk');

        fs.unlink(filename, (err) => {
            if (err) {
                console.log('Failed to remove file', err.toString());
            } else {
                console.log('removed', filename);
            }
        });
    }

    // update video metadata
    app.put('/userVideos/:id', async (req, res) => {
       try {
           const rawEventMetadata = req.body;
           const modifiedMetadata = eventsService.modifyEventMetadataForOpencast(rawEventMetadata);
           const data = await apiService.updateEventMetadata(modifiedMetadata, req.body.identifier);
           res.json({message : 'OK'});
       } catch(error) {
           res.status(500)
           const msg = error.message
           res.json({ message: 'Error', msg })
       }
    });
};