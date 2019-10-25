'use strict';
require('dotenv').config();

const api = require('./apiInfo');
const eventsService = require('../service/eventsService');
const seriesService = require('../service/seriesService');
const personApiService = require('../service/personApiService');
const apiService = require('../service/apiService');
const userService = require('../service/userService');
const publicationService = require('../service/publicationService');
const iamGroupsApi = require('../service/iamGroupsApi');
const busboy = require('connect-busboy');  //https://github.com/mscdex/connect-busboy
const path = require('path');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const {inboxSeriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions
const swaggerUi = require('swagger-ui-express');
const apiSpecs = require('../config/swagger'); // swagger config
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');
const messageKeys = require('../utils/message-keys');

module.exports = function (router) {
    // https://www.npmjs.com/package/swagger-ui-express
    router.use('/api-docs', swaggerUi.serve);
    router.get('/api-docs', swaggerUi.setup(apiSpecs));

    /**
     * @swagger
     *     /api/:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return status message (ping).
     *       responses:
     *         304:
     *           description: A status message (ping) with version info.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error    
     */
    router.get('/', api.apiInfo);

    /**
     * @swagger
     *     /api/user:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Returns the logged in user.
     *       responses:
     *         200:
     *           description: A user object in JSON.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error     
     */
    router.get("/user", (req, res) => {
        try {
            logger.info(`GET /user USER: ${req.user.eppn}`);
            res.json(userService.getLoggedUser(req.user));
        } catch(err) {
            const msg = error.message;
            logger.error(`Error GET /user ${msg} USER ${req.user.eppn}`);
            res.status(500);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_USER,
                msg
            });
        }
    });

    // busboy middle-ware
    router.use(busboy({
        highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
    }));

    /**
     * @swagger
     *     /api/event/{id}:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return video's details by ID.
     *       description: Returns selected video's information.
     *       parameters:
     *         - in: path
     *           name: id
     *           required: true
     *           description: ID of the video AKA event.
     *       responses:
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error    
     */
    router.get("/event/:id", async (req, res) => {
       try {
           logger.info(`GET video details /event/:id VIDEO ${req.params.id} USER: ${req.user.eppn}`);
           const event = await apiService.getEvent(req.params.id);
           const eventWithSerie = await eventsService.getEventWithSerie(event);
           const eventWithAcls = await eventsService.getEventAclsFromSerie(eventWithSerie);
           const eventWithVisibility = eventsService.calculateVisibilityProperty(eventWithAcls);
           const eventWithMetadata = await eventsService.getMetadataForEvent(eventWithVisibility);
           const eventWithMedia = await eventsService.getMediaForEvent(eventWithMetadata);
           const eventWithMediaFileMetadata = await eventsService.getMediaFileMetadataForEvent(eventWithMedia);
           const eventWithDuration = eventsService.getDurationFromMediaFileMetadataForEvent(eventWithMediaFileMetadata);
           res.json(eventWithDuration);
       } catch (error) {
           const msg = error.message;
           logger.error(`Error GET /event/:id ${msg} VIDEO ${req.params.id} USER ${req.user.eppn}`);
           res.status(500);
           res.json({
               message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_DETAILS,
               msg
            });
       }
    });

    /**
     * @swagger
     *     /api/videoUrl/{id}:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return video's highest quality media URL's by ID.
     *       description: Returns list of selected video's highest quality media URL's (url to video(s) file(s)).
     *       parameters:
     *         - in: path
     *           name: id
     *           required: true
     *           description: ID of the video AKA event.
     *       responses:
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error
     */
    router.get("/videoUrl/:id", async (req, res) => {
        try {
            logger.info(`GET video media url /videoUrl/:id VIDEO ${req.params.id} USER: ${req.user.eppn}`);
            const publications = await apiService.getPublicationsForEvent(req.params.id);
            const filteredPublication = publicationService.filterApiChannelPublication(publications);
            const mediaUrls = publicationService.getMediaUrlsFromPublication(req.params.id, filteredPublication);
            res.json(mediaUrls);
        } catch (error) {
            const msg = error.message;
            logger.error(`Error GET /videoUrl/:id ${msg} VIDEO ${req.params.id} USER ${req.user.eppn}`);
            res.status(500);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_VIDEO_URL,
                msg
            });
        }
    });

    /**
     * @swagger
     *     /api/series/{id}:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return series by ID.
     *       description: Returns selected series media and publish info
     *       parameters:
     *         - in: path
     *           name: id
     *           required: true
     *           description: ID of the series.
     *       responses:
     *         200:
     *           description: Series.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error
     */
     router.get('/series/:id', async (req, res) => {
        try {
            const series = await apiService.getSerie(req.params.id);
            await apiService.contributorsToIamGroupsAndPersons(series);
            const userSeriesWithPublished = await seriesService.addPublishedInfoInSeriesAndMoodleRoles(series);
            res.json(userSeriesWithPublished);
        } catch (error) {
            const msg = error.message;
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_SERIES_DETAILS,
                msg
            });
        }
    });

    /**
     * @swagger
     *     /api/series/{id}:
     *     put:
     *       tags:
     *         - update
     *       summary: Updates series information by ID.
     *       consumes:
     *         - application/json
     *       parameters:
     *         - in: body
     *           description: The series to be updated.
     *           schema:
     *             type: object
     *             required:
     *               - identifier
     *               - title
     *               - isPartOf
     *             properties:
     *               identifier:
     *                 type: string
     *                 description: id of the series
     *               title:
     *                 type: string
     *                 description: title of the series AKA the name
     *               description:
     *                 type: string
     *                 description: description for the series
     *       responses:
     *         200:
     *           description: OK
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.    
     */
    router.put('/series/:id', async (req, res) => {
        try {
            const rawEventMetadata = req.body;
            const loggedUser = userService.getLoggedUser(req.user);
            seriesService.addUserToEmptyContributorsList(rawEventMetadata, loggedUser);
            let modifiedMetadata = eventsService.modifySerieEventMetadataForOpencast(rawEventMetadata);
            let modifiedSeriesAclMetadata = seriesService.openCastFormatSeriesAclList(rawEventMetadata, constants.UPDATE_SERIES);
            const response = await apiService.updateSeriesAcldata(modifiedSeriesAclMetadata, req.body.identifier);
            const data = await apiService.updateSerieEventMetadata(modifiedMetadata, req.body.identifier);
            res.json({message: 'OK'});
        } catch (error) {
            res.status(500);
            const msg = error.message;
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_DETAILS,
                msg
            })
        }
    });

    /**
     * @swagger
     *     /api/userSeries:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return user's series.
     *       description: Returns series for logged in user. These series are the ones user is listed as contributor.
     *                    Published info of series is also returned.
     *       responses:
     *         200:
     *           description: List of series.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.
     */
    router.get('/userSeries', async (req, res) => {
        try {
            logger.info(`GET /userSeries USER: ${req.user.eppn}`);
            const loggedUser = userService.getLoggedUser(req.user);
            const userSeries = await apiService.getUserSeries(loggedUser);
            const userSeriesWithPublished = await seriesService.addPublishedInfoInSeries(userSeries);
            res.json(userSeriesWithPublished);
        } catch (error) {
            res.status(500);
            const msg = error.message;
            logger.error(`Error GET /userSeries ${msg} USER ${req.user.eppn}`);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_SERIES_LIST_FOR_USER,
                msg
            })
        }
    });

   /**
    * @swagger
    *     /api/userVideos:
    *     get:
    *       tags:
    *         - retrieve
    *       summary: Returns user's videos.
    *       description: Returns videos for logged user. Returns the videos that are connected to user's series.
    *       responses:
    *         200:
    *           description: List of videos.
    *         401:
    *           description: Not authenticated. Required Shibboleth headers not present in the request.
    *         500:
    *           description: Internal server error, an error occurred.
    */ 
    router.get('/userVideos', async (req, res) => {
        try {
            logger.info(`GET /userVideos USER: ${req.user.eppn}`);
            const loggedUser = userService.getLoggedUser(req.user);
            const ownSeries = await apiService.getUserSeries(loggedUser);
            const seriesIdentifiers = seriesService.getSeriesIdentifiers(ownSeries, loggedUser);
            const allEvents = await eventsService.getAllEvents(seriesIdentifiers);
            const concatenatedEventsArray = eventsService.concatenateArray(allEvents);
            const allEventsWithMetaDatas = await eventsService.getAllEventsWithMetadatas(concatenatedEventsArray);
            const allEventsWithMedia = await eventsService.getEventsWithMedia(allEventsWithMetaDatas);
            const allEventsWithMediaFile = await eventsService.getAllEventsWithMediaFileMetadata(allEventsWithMedia);
            const allEventsWithAcls = await eventsService.getAllEventsWithAcls(allEventsWithMediaFile);
            res.json(eventsService.filterEventsForClient(allEventsWithAcls));
        } catch (error) {
            res.status(500);
            const msg = error.message;
            logger.error(`Error GET /userVideos ${msg} USER ${req.user.eppn}`);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_LIST_FOR_USER,
                msg
            })
        }
    });


    const returnOrCreateUsersInboxSeries = async (loggedUser) => {
        const lataamoInboxSeriesTitle = inboxSeriesTitleForLoggedUser(loggedUser.eppn);

        try {
            const userSeries = await apiService.getUserSeries(loggedUser);
            let inboxSeries = userSeries.find(series => series.title === lataamoInboxSeriesTitle);

            if (!inboxSeries) {
                logger.info(`inbox series not found with title ${lataamoInboxSeriesTitle}`);
                inboxSeries = await apiService.createLataamoInboxSeries(loggedUser.eppn);
                logger.info(`Created inbox ${inboxSeries}`);
            }
            return inboxSeries;
        }catch(err){
            logger.error(`Error in returnOrCreateUsersInboxSeries ${err}`);
            throw err
        }
    }

    // make sure the upload dir exists
    const ensureUploadDir = async (directory) => {
        try {
            // https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md
            await fs.ensureDir(directory)
            logger.info(`Using uploadPath ${directory}`);
            return true;
        } catch (err) {
            logger.error(`Error in ensureUploadDir ${err}`);
            return false;
        }
    }

    /**
     * @swagger
     *     /api/userVideos:
     *     post:
     *       tags:
     *         - create
     *       summary: Upload a video file.
     *       description: Upload a video file to Opencast service. Video is saved to Lataamo proxy before sending to Opencast.
     *       consumes:
     *         - multipart/form-data
     *       parameters:
     *         - in: formData
     *           name: videofile
     *           type: file
     *           description: The video file to be uploaded.
     *       responses:
     *         200:
     *           description: OK. Response message in JSON containing msg and Opencast identifier for the video.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occured.
     */
    router.post('/userVideos', async (req, res) => {
        try {
            logger.info(`POST /userVideos - Upload video started. USER: ${req.user.eppn}`);
            const uploadPath = path.join(__dirname, 'uploads/');

            if (!ensureUploadDir(uploadPath)) {
                // upload dir failed log and return error
                logger.error(`Upload dir unavailable '${uploadPath}' USER: ${req.user.eppn}`);
                res.status(500);
                const msg = 'Upload dir unavailable.';
                res.json({
                    message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                    msg
                });
            }

            req.pipe(req.busboy); // Pipe it trough busboy

            let startTime;

            req.busboy.on('file', (fieldname, file, filename) => {
                startTime = new Date();
                logger.info(`Upload of '${filename}' started  USER: ${req.user.eppn}`);
                const filePathOnDisk = path.join(uploadPath, filename);

                // Create a write stream of the new file
                const fstream = fs.createWriteStream(filePathOnDisk);
                // Pipe it trough
                file.pipe(fstream);

                // On finish of the file write to disk
                fstream.on('close', async () => {
                    try {
                        const loggedUser = userService.getLoggedUser(req.user);
                        let timeDiff = new Date() - startTime;
                        logger.info(`Loading time with busboy ${timeDiff} milliseconds USER: ${req.user.eppn}`);

                        let inboxSeries;
                        try {
                            inboxSeries = await returnOrCreateUsersInboxSeries(loggedUser);

                            if (!inboxSeries || !inboxSeries.identifier) {
                                // on failure clean file from disk and return 500
                                deleteFile(filePathOnDisk);
                                res.status(500)
                                const msg = `${filename} failed to resolve inboxSeries for user`;
                                logger.error(`POST /userVideos ${msg} USER: ${req.user.eppn}`);
                                res.json({
                                    message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                                    msg
                                });
                            }
                        } catch (err) {
                            // Log error and throw reason
                            console.log(err)
                            throw "Failed to resolve user's inbox series";
                        }

                        try {
                            const response = await apiService.uploadVideo(filePathOnDisk, filename, inboxSeries.identifier);

                            if (response && response.status === 201) {
                                // on success clean file from disk and return 200
                                deleteFile(filePathOnDisk);
                                res.status(200);
                                logger.info(`${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. 
                                    Opencast event ID: ${JSON.stringify(response.data)} USER: ${req.user.eppn}`);
                                res.json({ message: `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. 
                                    Opencast event ID: ${JSON.stringify(response.data)}`})
                            } else {
                                // on failure clean file from disk and return 500
                                deleteFile(filePathOnDisk);
                                res.status(500);
                                const msg = `${ filename } failed.`;
                                res.json({
                                    message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                                    msg
                                });
                            }
                        } catch (err) {
                            // Log error and throw reason
                            console.log(err);
                            throw 'Failed to upload video to opencast';
                        }
                    } catch (err) {
                        // catch and clean file from disk
                        // return response to user client
                        deleteFile(filePathOnDisk);
                        res.status(500);
                        const msg = `Upload of ${filename} failed. ${err}.`;
                        logger.error(`POST /userVideos ${msg} USER: ${req.user.eppn}`);
                        res.json({
                            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                            msg
                        });
                    }
                });
            });
        } catch(err) {
            // catch and clean file from disk
            // TODO: filePathOnDisk is not defined here, remove file some other way
            // deleteFile(filePathOnDisk);
            // log error and return 500
            res.status(500);
            // TODO: ${filename} is not defined here log the file some other way
            const msg = `failed ${err}.`;
            logger.error(`POST /userVideos ${msg} USER: ${req.user.eppn}`);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                msg
            });
        }
    });

    // clean after post
    function deleteFile(filename) {
        fs.unlink(filename, (err) => {
            if (err) {
                logger.error(`Failed to remove ${filename} | ${err}`);
            } else {
                logger.info(`Removed ${filename}`);
            }
        });
    }

    /**
     * @swagger
     *     /api/userVideos/{id}:
     *     put:
     *       tags:
     *         - update
     *       summary: Updates video's information by ID.
     *       consumes:
     *         - application/json
     *       parameters:
     *         - in: body
     *           description: The video to be updated.
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
     *       responses:
     *         200:
     *           description: OK
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         403:
     *           description: Forbidden. Event (video) has an active transaction in progress on the Opencast server.
     *         500:
     *           description: Internal server error, an error occurred.    
     */
    router.put('/userVideos/:id', async (req, res) => {
        try {
            logger.info(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn}`);

            const rawEventMetadata = req.body;
            const response = await apiService.updateEventMetadata(rawEventMetadata, req.body.identifier);

            if (response.status === 200) {
                logger.info(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} OK`);
            } else if (response.status === 403){
                logger.warn(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
            } else {
                logger.error(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
            }

            res.status(response.status);
            res.json({message : response.statusText});
        } catch(error) {
            res.status(500);
            const msg = error.message;
            logger.error(`Error PUT /userVideos/:id ${msg} USER ${req.user.eppn}`);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DETAILS,
                msg
            });
        }
    });

    /**
     * @swagger
     *     /api/series:
     *     post:
     *       tags:
     *         - create
     *       summary: Creates new series with acls
     *       consumes:
     *         - application/json
     *       parameters:
     *         - in: body
     *           description: The series to be created
     *           schema:
     *             type: object
     *             required:
     *               - title
     *               - description
     *               - acl
     *               - contributors
     *             properties:
     *               title:
     *                 type: string
     *                 description: title of the series
     *               description:
     *                 type: string
     *                 description: description for the series
     *               acl:
     *                type: array
     *                items:
     *                  type: string
     *               contributors:
     *                type: array
     *                items:
     *                  type: string
     *       responses:
     *         200:
     *           description: OK, returns the new series identifier
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         403:
     *           description: Forbidden. Series' name contained "inbox".
     *         500:
     *           description: Internal server error, an error occurred.    
     */
    router.post('/series', async (req, res) => {
        try {
            let series = req.body;
            const loggedUser = userService.getLoggedUser(req.user);
            let exists = series.title.toLowerCase().includes('inbox');

            if(exists){
                res.status(403);
                res.json({message: '"inbox" not allowed in series title. Series was not created.'});
            }else{
                let modifiedSeriesMetadata = seriesService.openCastFormatSeriesMetadata(series, loggedUser);
                let modifiedSeriesAclMetadata = seriesService.openCastFormatSeriesAclList(series, constants.CREATE_SERIES);
                const response = await apiService.createSeries(req.user, modifiedSeriesMetadata, modifiedSeriesAclMetadata);
                res.json(response.data.identifier);
            }
        } catch (error) {
            res.status(500);
            const msg = error.message;
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES,
                msg
            });
        }
    });

    /**
     * @swagger
     *     /iamGroups/:query:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return iam groups by query
     *       description: Returns iam group(s) by query
     *       parameters:
     *         - in: path
     *           name: path
     *           required: true
     *           description: query values.
     *       responses:
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error    
     */
    router.get('/iamGroups/:query', async (req, res) => {
        try {
            logger.info(`GET /iamGroups/:query ${req.params.query}`);
            const iamGroups = await iamGroupsApi.getIamGroups(req.params.query);
            res.json(iamGroups);
        } catch (error) {
            const msg = error.message;
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_IAM_GROUPS,
                msg
            });
        }
    });

    /**
     * @swagger
     *     /persons/:query:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return persons by query
     *       description: Returns person(s) by query
     *       parameters:
     *         - in: path
     *           name: path
     *           required: true
     *           description: query values.
     *       responses:
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error    
     */
    router.get('/persons/:query', async (req, res) => {
        try {
            logger.info(`GET /persons/:query ${req.params.query}`);
            const persons = await personApiService.getPersons(req.params.query);
            res.json(persons);
        } catch (error) {
            const msg = error.message;
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_PERSONS,
                msg
            });
        }
    });
};