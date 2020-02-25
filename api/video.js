'use strict';

const userService = require('../service/userService');
const seriesService = require('../service/seriesService');
const eventsService = require('../service/eventsService');
const apiService = require('../service/apiService');
const publicationService = require('../service/publicationService');
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');
const webvttParser = require('node-webvtt');




exports.getVideoUrl = async (req, res) => {
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
};

exports.getUserVideos = async (req, res) => {
    try {
        logger.info(`GET /userVideos USER: ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const ownSeries = await apiService.getUserSeries(loggedUser);
        const ownSeriesWithoutTrash = await seriesService.filterTrashSeries(ownSeries);
        const seriesIdentifiers = seriesService.getSeriesIdentifiers(ownSeriesWithoutTrash, loggedUser);
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
        });
    }
};

exports.updateVideo = async (req, res) => {
    try {
        logger.info(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn}`);

        const rawEventMetadata = req.body;
        const response = await apiService.updateEventMetadata(rawEventMetadata, req.body.identifier, false, req.user);

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
};

exports.downloadVideo = async (req, res) => {
    try {
        console.log(req.body.mediaUrl);
        logger.info(`POST download VIDEO ${req.body.mediaUrl} USER ${req.user.eppn}`);
        const response = await apiService.downloadVideo(req.body.mediaUrl);
        response.data.pipe(res);
    } catch(error) {
        console.log('ERROR', error.message);
        res.status(500);
        const msg = error.message;
        logger.error(`Error PUT /userVideos/:id ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_DOWNLOAD_VIDEO,
            msg
        });
    }
};


exports.uploadVideoTextTrack = async(req, res) => {
    // https://attacomsian.com/blog/express-file-upload-multer
    // https://www.npmjs.com/package/multer
    logger.info('addVideoTextTrack called.');
    try {
        // get the vtt file from the form
        const vttFile = req.file;

        // make sure file was available
        if (!vttFile) {
            res.status(400).send({
                status: false,
                data: 'No file is selected.'
            });
        } else {
            // vttFile structure:
            //{   fieldname: 'video_webvtt_file',
            //    originalname: 'fulica.vtt',
            //    encoding: '7bit',
            //    mimetype: 'text/vtt',
            //    buffer: <Buffer xyz.....>,
            //    size: 226 }

            // do some validation to the file
            const parsed = webvttParser.parse(vttFile.buffer.toString());

            if (parsed && parsed.valid) {
                // all ok
                logger.info('vtt file parsed ok, next file to opencast.');
                // TODO: send the vtt file to opencast
                // const response = await apiService.uploadVideoTextTrack(file, eventId);
                // res.status(response.status);
                // res.json({message : response.statusText});
                res.send({
                    status: true,
                    message: 'File received in unitube-lataamo.',
                    data: {
                        name: vttFile.originalname,
                        mimetype: vttFile.mimetype,
                        size: vttFile.size
                    }
                });
            } else {
                // not all ok
                logger.error(`vtt file seems to be malformed, please check. USER ${req.user.eppn}`);

                res.status(400);
                const msg = 'vtt file seems to be malformed, please check.'
                res.json({
                    message: 'Failure in video text track upload',
                    msg
                });
            }
        }
    } catch (err) {
        logger.error(`addVideoTextTrack USER ${req.user.eppn}`);

        res.status(500);
        const msg = err.message;
        res.json({
            message: 'Failure in video text track upload',
            msg
        });
    }
};
