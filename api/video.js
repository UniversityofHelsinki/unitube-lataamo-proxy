'use strict';

const userService = require('../service/userService');
const seriesService = require('../service/seriesService');
const eventsService = require('../service/eventsService');
const apiService = require('../service/apiService');
const publicationService = require('../service/publicationService');
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');
const fs = require('fs');

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
};

exports.updateVideo = async (req, res) => {
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
};

exports.downloadVideo = async (req, res) => {
    try {
        console.log(req.body.mediaUrl);
        logger.info(`POST download VIDEO ${req.body.mediaUrl} USER ${req.user.eppn}`);
        const response = await apiService.downloadVideo(req.body.mediaUrl);
        let contentType = response.headers['content-type'];
        let contentLength = response.headers['content-length'];
        res.setHeader('Content-Transfer-Encoding', 'binary');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', contentLength);
        res.send(new Buffer.from(response.data, 'binary'))
    } catch(error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error PUT /userVideos/:id ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_DOWNLOAD_VIDEO,
            msg
        });
    }
};