'use strict';
require('dotenv').config();
const api = require('./apiInfo');
const eventsService = require('../service/eventsService');
const seriesService = require('../service/seriesService');
const apiService = require('../service/apiService');
const userService = require('../service/userService');
const publicationService = require('../service/publicationService');
const busboy = require('connect-busboy');  //https://github.com/mscdex/connect-busboy
const path = require('path');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const { inboxSeriesTitleForLoggedUser } = require('../utils/helpers'); // helper functions


module.exports = function(app) {

    /**
    * @swagger
    *     /:
    *     get:
    *       tags:
    *         - retrieve
    *       summary: alive message (ping)
    *       responses:
    *         304:
    *           description: This returns alive message (ping)
    */
    app.get('/', api.apiInfo);

    /**
     * @swagger
     *     /user:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: user info
     *       description: This should return logged user
     */
    app.get("/user", (req, res) => {
        res.json(userService.getLoggedUser(req.user));
    });

    // busboy middle-ware
    app.use(busboy({
        highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
    })); 

   /**
    * @swagger
    *     /event/{id}:
    *     get:
    *       tags:
    *         - retrieve
    *       summary: video's details
    *       description: This should return selected video's metadata
    *       parameters:
    *         - in: path
    *           name: id
    *           required: true
    *           description: ID of the video (event) to get
    */    
    app.get("/event/:id", async (req, res) => {
       try {
           const event = await apiService.getEvent(req.params.id);
           const eventWithSerie = await eventsService.getEventWithSerie(event);
           const eventWithAcls = await eventsService.getEventAclsFromSerie(eventWithSerie);
           const eventWithVisibility = eventsService.calculateVisibilityProperty(eventWithAcls);
           const eventWithMetadata = await eventsService.getMetadataForEvent(eventWithVisibility);
           const eventWithMedia = await eventsService.getMediaForEvent(eventWithMetadata);
           const eventWithMediaFileMetadata = await eventsService.getMediaFileMetadataForEvent(eventWithMedia);
           const eventWithDuration = eventsService.getDurationFromMediaFileMetadataForEvent(eventWithMediaFileMetadata);
           console.log('eventWithDuration', eventWithDuration);
           res.json(eventWithDuration);
       } catch (error) {
           const msg = error.message
           res.json({ message: 'Error', msg });
       }
    });


   /**
    * @swagger
    *     /video/{id}:
    *     get:
    *       tags:
    *         - retrieve
    *       summary: video's media URL
    *       description: Returns selected video's media URL (url to media file)
    *       parameters:
    *         - in: path
    *           name: id
    *           required: true
    *           description: ID of the video (event)
    */     
    app.get("/video/:id", async (req, res) => {
        try {
            const publications = await apiService.getPublicationsForEvent(req.params.id);
            const filteredPublication = publicationService.filterApiChannelPublication(publications);
            const mediaUrl = publicationService.getMediaUrlFromPublication(req.params.id, filteredPublication);
            res.json(mediaUrl);
        } catch(error) {
            const msg = error.message
            res.json({ message: 'Error', msg });
        }
    });

    
   /**
    * @swagger
    *     /userSeries:
    *     get:
    *       tags:
    *         - retrieve
    *       summary: user's series
    *       description: Returns series for logged user
    */ 
    app.get('/userSeries', async (req, res) => {
        try {
            const loggedUser = userService.getLoggedUser(req.user);
            const allSeries = await apiService.getAllSeries();
            const userSeries = seriesService.getUserSeries(allSeries, loggedUser);
            res.json(userSeries);
        } catch(error) {
            res.status(500)
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });

     
   /**
    * @swagger
    *     /userVideos:
    *     get:
    *       tags:
    *         - retrieve
    *       summary: user's videos
    *       description: videos for logged user
    */ 
    app.get('/userVideos', async (req, res) => {
        try {
            const allSeries = await apiService.getAllSeries();
            const loggedUser = userService.getLoggedUser(req.user);
            const seriesIdentifiers = seriesService.getSeriesIdentifiers(allSeries, loggedUser);
            const allEvents = await eventsService.getAllEvents(seriesIdentifiers);
            const concatenatedEventsArray = eventsService.concatenateArray(allEvents);
            const allEventsWithMetaDatas = await eventsService.getAllEventsWithMetadatas(concatenatedEventsArray);
            const allEventsWithMedia = await eventsService.getEventsWithMedia(allEventsWithMetaDatas);
            const allEventsWithMediaFile = await eventsService.getAllEventsWithMediaFileMetadata(allEventsWithMedia);
            const allEventsWithAcls = await eventsService.getAllEventsWithAcls(allEventsWithMediaFile);
            res.json(eventsService.filterEventsForClient(allEventsWithAcls));
        } catch (error) {
            res.status(500)
            const msg = error.message
            res.json({ message: 'Error', msg })
        }
    });


    const returnOrCreateUsersInboxSeries = async (loggedUser) => {
        const lataamoInboxSeriesTitle = inboxSeriesTitleForLoggedUser(loggedUser.eppn);

        try {
            const allSeries = await apiService.getAllSeries();
            const userSeries = seriesService.getUserSeries(allSeries, loggedUser);
    
            let inboxSeries = userSeries.find(series => series.title === lataamoInboxSeriesTitle);
          
            if (!inboxSeries) {
                console.log('INBOX series not found with title', lataamoInboxSeriesTitle);
                inboxSeries = await apiService.createLataamoInboxSeries(loggedUser.eppn);
                console.log('created inbox', inboxSeries);
            }
            return inboxSeries;
        }catch(err){
            throw err
        }
    }

    // make sure the upload dir exists
    const ensureUploadDir = async (directory) => {
        try {
            // https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md
            await fs.ensureDir(directory)
            console.log('using uploadPath:', directory);
            return true;
        } catch (err) {
            console.error('Error in ensureUploadDir', err)
            return false;
        }
    }

   /**
    * @swagger
    *     /userVideos:
    *     post:
    *       tags:
    *         - create
    *       summary: Upload video file
    *       description: Upload a video file to Opencast
    *       consumes:
    *         - multipart/form-data
    *       parameters:
    *         - in: formData
    *           name: videofile
    *           type: file
    *           description: The video to be uploaded
    *       responses:
    *         201:
    *           description: Created
    *         500:
    *           description: TBD, something went wrong
    */      
    app.post('/userVideos', async (req, res) => {
        try {
            const uploadPath = path.join(__dirname, 'uploads/');

            if(!ensureUploadDir(uploadPath)){
                // upload dir failed log and return error
                console.log('Upload dir unavailable', uploadPath);
                res.status(500);
                const msg = 'Upload dir unavailable.'
                res.json({ message: 'Error', msg });
            }

            req.pipe(req.busboy); // Pipe it trough busboy

            let startTime;

            req.busboy.on('file', (fieldname, file, filename) => {
                startTime = new Date()
                console.log(`Upload of '${filename}' started`);
                const filePathOnDisk = path.join(uploadPath, filename);

                // Create a write stream of the new file
                const fstream = fs.createWriteStream(filePathOnDisk);
                // Pipe it trough
                file.pipe(fstream);

                // On finish of the file write to disk
                fstream.on('close', async () => {
                    try {
                        const loggedUser = userService.getLoggedUser(req.user);
                        let timeDiff = new Date() - startTime;
                        console.log('Loading time with busboy', timeDiff, 'milliseconds');
                        
                        let inboxSeries
                        try {
                            inboxSeries = await returnOrCreateUsersInboxSeries(loggedUser);

                            if (!inboxSeries || !inboxSeries.identifier) {
                                res.status(500)
                                res.json({ message: `${filename} failed to resolve inboxSeries for user`})
                            }
                        } catch(err) {
                            // Log error and throw reason
                            console.log(err)
                            throw "Failed to resolve user's inbox series";
                        }
                        
                        try {
                            const response = await apiService.uploadVideo(filePathOnDisk, filename, inboxSeries.identifier)
                    
                            if (response && response.status == 201) {
                                // on succes clean file from disk and return 200
                                deleteFile(filePathOnDisk);
                                res.status(200)
                                res.json({ message: `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)}`})
                            } else {
                                // on failure clean file from disk and return 500
                                deleteFile(filePathOnDisk);
                                res.json({ message: `${filename} failed.`})
                                res.status(500)
                            }
                        } catch(err) {
                            // Log error and throw reason
                            console.log(err);
                            throw 'Failed to upload video to opencast';
                        }
                    } catch(err) {
                        // catch and clean file from disk
                        // return response to user client
                        deleteFile(filePathOnDisk);
                        res.status(500);
                        const msg = `Upload of ${filename} failed. ${err}.`;
                        res.json({ message: 'Error', msg });
                    }
                });
            });
        } catch(err) {
            // log error and return 500
            console.log(err);
            res.status(500);
            const msg = `${filename} failed ${err}.`;
            res.json({ message: 'Error', msg });
        }
    });

    // clean after post
    function deleteFile(filename) {
        console.log('delete file from disk');

        fs.unlink(filename, (err) => {
            if (err) {
                console.log('Failed to remove file', err.toString());
            } else {
                console.log('removed', filename);
            }
        });
    }

    
   /**
    * @swagger
    *     /userVideos/{id}:
    *     put:
    *       tags:
    *         - update
    *       summary: Updates video information
    *       consumes:
    *         - application/json
    *       parameters:
    *         - in: body
    *           description: The video to be updated
    *           schema: 
    *             type: object
    *             required:
    *               - identifier
    *               - title
    *               - isPartOf
    *             properties:
    *               identifier:
    *                 type: string
    *                 description: id of the video
    *               title:
    *                 type: string
    *                 description: title of the video AKA the name
    *               description:
    *                 type: string
    *                 description: description for the video
    *               isPartOf:
    *                 type: string
    *                 description: id of the series the video belongs to
    *     responses:
    *         200:
    *           description: OK
    */   
    app.put('/userVideos/:id', async (req, res) => {
       try {
           const rawEventMetadata = req.body;
           const modifiedMetadata = eventsService.modifyEventMetadataForOpencast(rawEventMetadata);
           const data = await apiService.updateEventMetadata(modifiedMetadata, req.body.identifier);
           res.json({message : 'OK'});
       } catch(error) {
           res.status(500)
           const msg = error.message
           res.json({ message: 'Error', msg })
       }
    });
};