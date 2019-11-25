'use strict';

const apiService = require('../service/apiService');
const eventsService = require('../service/eventsService');
const licenseService = require('../service/licenseService');
const userService = require('../service/userService');
const seriesService = require('../service/seriesService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');

exports.getEvent = async (req, res) => {
    try {
        logger.info(`GET video details /event/:id VIDEO ${req.params.id} USER: ${req.user.eppn}`);
        const event = await apiService.getEvent(req.params.id);
        const eventWithSeries = await eventsService.getEventWithSeries(event);
        const eventWithAcls = await eventsService.getEventAclsFromSeries(eventWithSeries);
        const eventWithVisibility = eventsService.calculateVisibilityProperty(eventWithAcls);
        const eventWithMetadata = await eventsService.getMetadataForEvent(eventWithVisibility);
        const eventWithMedia = await eventsService.getMediaForEvent(eventWithMetadata);
        const eventWithMediaFileMetadata = await eventsService.getMediaFileMetadataForEvent(eventWithMedia);
        const eventWithDuration = eventsService.getDurationFromMediaFileMetadataForEvent(eventWithMediaFileMetadata);
        const eventWithLicense = eventsService.getLicenseFromEventMetadata(eventWithDuration);
        const eventWithLicenseOptions = licenseService.getLicenseOptions(eventWithLicense);
        res.json(eventWithLicenseOptions);
    } catch (error) {
        const msg = error.message;
        logger.error(`Error GET /event/:id ${msg} VIDEO ${req.params.id} USER ${req.user.eppn}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_DETAILS,
            msg
        });
    }
};

exports.getInboxEvents = async (req, res) => {
    logger.info(`GET /userInboxEvents USER: ${req.user.eppn}`);
    const loggedUser = userService.getLoggedUser(req.user);
    try{
        const inboxSeries = await apiService.getUserInboxSeries(loggedUser);
        if (inboxSeries && inboxSeries.length > 0) {
            const identifier = seriesService.getInboxSeriesIdentifier(inboxSeries);
            const inboxEvents = await apiService.getEventsByIdentifier(identifier);
            const inboxEventsWithMetadatas = await eventsService.getAllEventsWithMetadatas(inboxEvents);
            const inboxEventsWithMedia = await eventsService.getEventsWithMedia(inboxEventsWithMetadatas);
            const inboxEventsWithMediaFile = await eventsService.getAllEventsWithMediaFileMetadata(inboxEventsWithMedia);
            const inboxEventsWithAcls = await eventsService.getAllEventsWithAcls(inboxEventsWithMediaFile);
            res.json(eventsService.filterEventsForClient(inboxEventsWithAcls));
        } else {
            res.json([])
        }
    }catch(error){
        const msg = error.message;
        logger.error(`Error GET /userInboxEvents ${msg} USER ${req.user.eppn}`);
        res.status(500);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_INBOX_EVENTS,
            msg
        });
    }
};
