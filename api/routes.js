'use strict';
require('dotenv').config();

const api = require('./apiInfo');
const user = require('./user');
const event = require('./event');
const video = require('./video');
const series = require('./series');
const videoUpload = require('./videoUpload');
const iamGroups = require('./iamGroups');
const persons = require('./persons');
const jobs = require('./jobs');


const swaggerUi = require('swagger-ui-express');
const apiSpecs = require('../config/swagger'); // swagger config

module.exports = function (router) {
    // https://www.npmjs.com/package/swagger-ui-express
    router.use('/api-docs', swaggerUi.serve);
    router.get('/api-docs', swaggerUi.setup(apiSpecs));

    /**
     * @swagger
     *     /api:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return status message (ping).
     *       responses:
     *         304:
     *           description: A status message (ping) with version info.
     *         default:
     *           description: Unexpected error
     */
    router.get('/info', api.apiInfo);

    /**
     * @swagger
     *     /api/user:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Returns the logged in user.
     *       responses:
     *         200:
     *           description: A user object in JSON.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error
     */
    router.get('/user', user.userInfo);


    router.get('/logout', user.logout);

    /**
     * @swagger
     *     /api/event/{id}:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return video's details by ID.
     *       description: Returns selected video's information.
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
    router.get('/event/:id', event.getEvent);

    /**
     * @swagger
     *     /api/videoUrl/{id}:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return video's highest quality media URL's by ID.
     *       description: Returns list of selected video's highest quality media URL's (url to video(s) file(s)).
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
    router.get('/videoUrl/:id', video.getVideoUrl);

    /**
     * @swagger
     *     /api/series/{id}:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return series by ID.
     *       description: Returns selected series media and publish info
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
    router.get('/series/:id', series.getSeries);

    /**
     * @swagger
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
    router.put('/series/:id', series.updateSeries);

    /**
     * @swagger
     *     /api/userInboxEvents:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return user's inbox events.
     *       description: Returns inbox series events for logged in user.
     *       responses:
     *         200:
     *           description: List of inbox series events.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.
     */
    router.get('/userInboxEvents', event.getInboxEvents);

    /**
     * @swagger
     *     /api/vttFilesForEvent:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return vtt file
     *       description: Returns vtt file for event
     *       responses:
     *         200:
     *           description: VTT file for event.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.
     */
    router.get('/vttFileForEvent/:id', event.getVttFileForEvent);


    /**
     * @swagger
     *     /api/userTrashEvents:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return user's trash events.
     *       description: Returns trash series events for logged in user.
     *       responses:
     *         200:
     *           description: List of trash series events.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.
     */
    router.get('/userTrashEvents', event.getTrashEvents);

    /**
     * @swagger
     *     /api/userSeries:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return user's series without inbox series.
     *       description: Returns series for logged in user. These series are the ones user is listed as contributor.
     *                    Published info of series is also returned.
     *       responses:
     *         200:
     *           description: List of series.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.
     */
    router.get('/userSeries', series.getUserSeries);


    /**
     * @swagger
     *     /api/userSeries:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return user's series.
     *       description: Returns series for logged in user. These series are the ones user is listed as contributor.
     *                    Published info of series is also returned.
     *       responses:
     *         200:
     *           description: List of series.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.
     */
    router.get('/getUserSeriesDropDownList', series.getUserSeriesDropDownList);

    /**
     * @swagger
     *     /api/userVideos:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Returns user's videos.
     *       description: Returns videos for logged user. Returns the videos that are connected to user's series.
     *       responses:
     *         200:
     *           description: List of videos.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         500:
     *           description: Internal server error, an error occurred.
     */
    router.get('/userVideos', video.getUserVideos);

    /**
     * @swagger
     *     /api/userVideos:
     *     post:
     *       tags:
     *         - create
     *       summary: Upload a video file.
     *       description: Upload a video file to Opencast service. Video is saved to Lataamo proxy before sending to Opencast.
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
     *           description: Internal server error, an error occurred.
     */
    router.post('/userVideos', videoUpload.upload);

    /**
     * @swagger
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
    router.put('/userVideos/:id', video.updateVideo);

    /**
     * @swagger
     *     /api/moveEventToTrash/{id}:
     *     put:
     *       tags:
     *         - update
     *       summary: Updates video's series by ID.
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
    router.put('/moveEventToTrash/:id', event.moveToTrash);

    /**
     * @swagger
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
    router.post('/series', series.createSeries);

    /**
     * @swagger
     *     /iamGroups/:query:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return iam groups by query
     *       description: Returns iam group(s) by query
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
    router.get('/iamGroups/:query', iamGroups.getIamGroups);

    /**
     * @swagger
     *     /persons/:query:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return persons by query
     *       description: Returns person(s) by query
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
    router.get('/persons/:query', persons.getPersons);

    router.post('/download' , video.downloadVideo);

    /**
     * @swagger
     *     api/videoTextTrack:
     *     post:
     *       tags:
     *         - create
     *       summary: Receive a video text track file (WebVTT) for a video (opencast event)
     *       description: Receive video text track file (WebVTT) for a video identified by eventId and send it to opencast server.
     *       parameters:
     *         - in: body
     *           description: multipart/form-data from the client
     *       responses:
     *         200:
     *           description: File was successfully received and sent to opencast for further processing.
     *         400:
     *           description: In-case of bad request, wrong file format etc.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error.
     */
    router.post('/videoTextTrack', video.uploadVideoTextTrack);


    /**
     * @swagger
     *     api/videoTextTrack:
     *     put:
     *       tags:
     *         - delete
     *       summary: Delete a video text track file (WebVTT) for a video (opencast event)
     *       description: Delete video text track file (WebVTT) for a video identified by eventId and send it to opencast server.
     *       parameters:
     *         - in: body
     *           description: multipart/form-data from the client
     *       responses:
     *         200:
     *           description: File was successfully received and sent to opencast for further processing.
     *         400:
     *           description: In-case of bad request, wrong file format etc.
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error.
     */
    router.delete('/videoTextTrack/:eventId', video.deleteVideoTextTrack);


    /**
     * @swagger
     *     /api/monitor/{jobId}:
     *     get:
     *       tags:
     *         - retrieve
     *       summary: Return job status by jobId.
     *       description: Returns job status by jobId
     *       parameters:
     *         - in: path
     *           name: jobId
     *           required: true
     *           description: ID of the job.
     *       responses:
     *         201:
     *           description: Job is finished.
     *         202:
     *           description: Job is still processing
     *         401:
     *           description: Not authenticated. Required Shibboleth headers not present in the request.
     *         default:
     *           description: Unexpected error
     */
    router.get('/monitor/:jobId', jobs.getJobStatus);
};
