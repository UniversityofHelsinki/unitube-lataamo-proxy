'use strict';

const apiService = require('../service/apiService');
const eventsService = require('../service/eventsService');
const licenseService = require('../service/licenseService');
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