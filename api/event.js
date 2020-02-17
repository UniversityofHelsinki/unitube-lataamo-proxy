'use strict';

const apiService = require('../service/apiService');
const eventsService = require('../service/eventsService');
const licenseService = require('../service/licenseService');
const userService = require('../service/userService');
const seriesService = require('../service/seriesService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');

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
        // get or create trash series for user
        const trashSeries = await apiService.returnOrCreateUsersSeries(constants.TRASH, loggedUser);
    }catch(error){
        const msg = error.message;
        logger.error(`Error GET/CREATE userTrashEvents ${msg} USER ${req.user.eppn}`);
        res.status(500);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_TRASH_EVENTS,
            msg
        });
    }

    try{
        // get inbox series for user
        const inboxSeries = await apiService.returnOrCreateUsersSeries(constants.INBOX, loggedUser);
        if (inboxSeries && inboxSeries.length > 0) {
            const inboxEventsWithAcls = await fetchEventMetadata(inboxSeries);
            res.json(eventsService.filterEventsForClient(inboxEventsWithAcls));
        } else {
            res.json([]);
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

exports.getTrashEvents = async (req, res) => {
    logger.info(`GET /userTrashEvents USER: ${req.user.eppn}`);
    const loggedUser = userService.getLoggedUser(req.user);
    try{
        const trashSeries = await apiService.getUserTrashSeries(loggedUser);
        if(trashSeries && trashSeries.length > 0){
            const trashEventsWithAcls = await fetchEventMetadata(trashSeries);
            res.json(eventsService.filterEventsForClientTrash(trashEventsWithAcls));
        }else{
            res.json([]);
        }
    }catch(error){
        const msg = error.message;
        logger.error(`Error GET /userTrashEvents ${msg} USER ${req.user.eppn}`);
        res.status(500);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_INBOX_EVENTS,
            msg
        });
    }
};

const fetchEventMetadata = async (series) => {
    const identifier = seriesService.getSeriesIdentifier(series);
    const events = await apiService.getEventsByIdentifier(identifier);
    const eventsWithMetadatas = await eventsService.getAllEventsWithMetadatas(events);
    const eventsWithMedia = await eventsService.getEventsWithMedia(eventsWithMetadatas);
    const eventsWithMediaFile = await eventsService.getAllEventsWithMediaFileMetadata(eventsWithMedia);
    const eventsWithAcls = await eventsService.getAllEventsWithAcls(eventsWithMediaFile);
    return eventsWithAcls;
};

exports.moveToTrash = async (req, res) =>{
    try {
        logger.info(`PUT /moveEventToTrash/:id VIDEO ${req.body.identifier} USER ${req.user.eppn}`);
        const rawEventMetadata = req.body;
        const loggedUser = userService.getLoggedUser(req.user);
        const response = await apiService.updateEventMetadata(rawEventMetadata, req.body.identifier, true, loggedUser);

        if (response.status === 200) {
            logger.info(`PUT /moveEventToTrash/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} OK`);
        } else if (response.status === 403){
            logger.warn(`PUT /moveEventToTrash/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
        } else {
            logger.error(`PUT /moveEventToTrash/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
        }

        res.status(response.status);
        res.json({message : response.statusText});
    } catch (error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error PUT /moveEventToTrash/:id ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_MOVE_EVENT_TO_TRASH,
            msg
        });
    }
};
