'use strict';

const apiService = require('../service/apiService');
const eventsService = require('../service/eventsService');
const licenseService = require('../service/licenseService');
const publicationService = require('../service/publicationService');
const userService = require('../service/userService');
const seriesService = require('../service/seriesService');
const dbService = require('../service/dbService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');
const { encrypt } = require('../utils/encrption.js');

exports.getEvent = async (req, res) => {
    try {
        logger.info(`GET video details /event/:id VIDEO ${req.params.id} USER: ${req.user.eppn}`);
        const event = await apiService.getEvent(req.params.id);
        if (!event) {
          return res.status(404).end();
        } else if (!await eventsService.userHasPermissionsForEvent(req.user, event.identifier)) {
          return res.status(403).end();
        }

        const eventWithSeries = await eventsService.getEventWithSeries(event);

        const eventWithAcls = await eventsService.getEventAclsFromSeries(eventWithSeries);
        const eventWithVisibility = eventsService.calculateVisibilityProperty(eventWithAcls);
        const eventWithMedia = await eventsService.getMediaForEvent(eventWithVisibility);
        const eventWithMediaFileMetadata = await eventsService.getMediaFileMetadataForEvent(eventWithMedia);
        const eventWithDuration = eventsService.getDurationFromMediaFileMetadataForEvent(eventWithMediaFileMetadata);
        const eventWithLicense = eventsService.getLicenseFromEventMetadata(eventWithDuration);
        const eventWithLicenseOptions = licenseService.getLicenseOptions(eventWithLicense);
        const eventWithLicenseOptionsAndVideoViews = await eventsService.getEventViews(req.params.id, eventWithLicenseOptions);

        const eventPublications = await apiService.getPublicationsForEvent(req.params.id);
        const eventDownloadableMediaUrls = await eventsService.calculateMediaPropertyForVideoList({ ...event, publications: eventPublications }, req.user.eppn);
        const eventDownloadableMedia = eventsService.mapPublications(eventDownloadableMediaUrls, eventPublications);
        const encryptedDownloadableMedia = Object.fromEntries(Object.keys(eventDownloadableMedia).map((url) => {
            const encrypted = encrypt(url);
            return [encrypted, { ...eventDownloadableMedia[url], url: encrypted }];
        }));

        res.json({ ...eventWithLicenseOptionsAndVideoViews, downloadableMedia: encryptedDownloadableMedia});

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

exports.getVttFileForEvent = async (req, res) => {
    try {
        const episode = await apiService.getEpisodeForEvent(req.params.id);
        const publications = await apiService.getPublicationsForEvent(req.params.id);
        //const filteredPublication = publicationService.filterEngagePlayerChannelPublication(publications);
        const mediaUrls = publicationService.getMediaUrlsFromPublication(req.params.id, publications);
        const vttFile = await eventsService.getVttFile(episode, mediaUrls);
        const response = await apiService.downloadVttFile(vttFile);
        response.body.pipe(res);
    } catch(error) {
        console.log('ERROR', error.message);
        res.status(500);
        const msg = error.message;
        logger.error(`Error GET /vttFileForEvent/:id ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_DOWNLOAD_VIDEO,
            msg
        });
    }
};


exports.getInboxEvents = async (req, res) => {
    logger.info(`GET /userInboxEvents USER: ${req.user.eppn}`);
    const loggedUser = userService.getLoggedUser(req.user);

    try{
        // get or create trash series for user
        await apiService.returnOrCreateUsersSeries(constants.TRASH, loggedUser);
    }catch(error){
        const msg = error.message;
        logger.error(`Error GET/CREATE userTrashEvents ${msg} USER ${req.user.eppn}`);
        res.status(500);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_TRASH_EVENTS,
            msg
        });
    }
    let events = null;
    let inboxEventsWithAcls = null;

    try{
        // get inbox series for user
        const inboxSeries = await apiService.returnOrCreateUsersSeries(constants.INBOX, loggedUser);

        if (inboxSeries && inboxSeries.length > 0) {
            inboxEventsWithAcls = await fetchEventMetadata(inboxSeries);
            events = eventsService.filterEventsForClientList(inboxEventsWithAcls, loggedUser)
                .map(async event => ({
                    ...event,
                    deletionDate: await dbService.getArchivedDate(event.identifier),
                    subtitles: await eventsService.subtitles(event.identifier)
                }));
            res.json(await Promise.all(events));
            // insert removal date to postgres db
            await dbService.insertArchivedAndCreationDates(inboxEventsWithAcls, loggedUser);
        } else {
            res.json([]);
        }
    } catch(error) {
        const msg = error.message;
        logger.error(`Error GET /userInboxEvents ${error} ${msg}  USER ${req.user.eppn}`);
        res.status(500);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_INBOX_EVENTS,
            msg
        });
    }
};

/**
 * Checks if video have subtitle
 *
 * @param identifier
 * @returns {Promise<boolean>}
 */
const subtitles = async (identifier) => {

    const publications = await apiService.getPublicationsForEvent(identifier);
    const mediaUrls = publicationService.getMediaUrlsFromPublication(identifier, publications);
    const episode = await apiService.getEpisodeForEvent(identifier);
    let episodeWithMediaUrls = await eventsService.getVttWithMediaUrls(episode, mediaUrls);
    const subtitles = episodeWithMediaUrls.map((video) => video && video.vttFile && video.vttFile.url).filter(url => url !== undefined && url !== 'empty.vtt' && url !== '');

    if (subtitles.length > 0) {
        return true;
    } else {
        return false;
    }
};

exports.getTrashEvents = async (req, res) => {
    logger.info(`GET /userTrashEvents USER: ${req.user.eppn}`);
    const loggedUser = userService.getLoggedUser(req.user);
    try{
        const trashSeries = await apiService.getUserTrashSeries(loggedUser);
        if(trashSeries && trashSeries.length > 0){
            const trashEventsWithAcls = await fetchEventMetadata(trashSeries);
            const trashEventsWithoutArchiveDate = eventsService.filterEventsForClientTrash(trashEventsWithAcls, loggedUser);
            const trashEventsWithArchiveDates = await Promise.all(trashEventsWithoutArchiveDate.map(async event  => {
                return {
                    ...event,
                    realDeletionDate: await dbService.getArchivedDate(event.identifier),
                    subtitles: await eventsService.subtitles(event.identifier)
                };
            }));
            res.json(trashEventsWithArchiveDates);
        }else{
            res.json([]);
        }
    }catch(error){
        const msg = error.message;
        logger.error(`Error GET /userTrashEvents ${msg} USER ${req.user.eppn}`);
        res.status(500);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_TRASH_EVENTS,
            msg
        });
    }
};

const fetchEventMetadata = async (series) => {
    const identifier = seriesService.getSeriesIdentifier(series);
    const allEventsWithMetaData = await eventsService.getAllEventsBySeriesIdentifier(identifier);
    return allEventsWithMetaData;
};

exports.moveToTrash = async (req, res) =>{
    try {
        logger.info(`PUT /moveEventToTrash/:id VIDEO ${req.body.identifier} USER ${req.user.eppn}`);
        const rawEventMetadata = req.body;
        if (!await eventsService.userHasPermissionsForEvent(req.user, req.params.id)) {
          return res.status(403).end();
        }
        const loggedUser = userService.getLoggedUser(req.user);
        const response = await apiService.updateEventMetadata(rawEventMetadata, req.body.identifier, true, loggedUser);

        if (response.status === 200) {
            logger.info(`PUT /moveEventToTrash/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} OK`);
            await dbService.insertOrUpdateVideoArchivedDate(req.body.identifier, loggedUser);
            await dbService.updateSkipEmailStatus(req.body.identifier, loggedUser, true);
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

exports.getEventDeletionDate = async (req, res) => {
    try {
        logger.info(`GET video deletion date /event/:id/deletionDate VIDEO ${req.params.id} USER: ${req.user.eppn}`);
        const deletionDate = await dbService.getArchivedDate(req.params.id);
        if (!deletionDate) {
          return res.status(404).end();
        } else if (!await eventsService.userHasPermissionsForEvent(req.user, req.params.id)) {
          return res.status(403).end();
        }
        res.json({
            deletionDate: deletionDate
        });
    } catch (error) {
        const msg = error.message;
        logger.error(`Error GET /event/:id/deletionDate ${msg} VIDEO ${req.params.id} USER ${req.user.eppn}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_DELETION_DATE,
            msg
        });
    }
};

exports.updateEventDeletionDate = async (req,res) => {
    try {
        logger.info(`PUT video deletion date /event/:id/deletionDate VIDEO ${req.params.id} USER: ${req.user.eppn}`);
        const rawEventDeletionDateMetadata = req.body;
        if (!await eventsService.userHasPermissionsForEvent(req.user, req.params.id)) {
          return res.status(403).end();
        }
        const loggedUser = userService.getLoggedUser(req.user);

        const isoDbDeletionDate = (await dbService.getArchivedDate(req.params.id)).toISOString();
        const isoFormDeletionDate = req.body.deletionDate;

        const response = await dbService.updateArchivedDate(req.params.id, rawEventDeletionDateMetadata, req.user);

        if (response.status === 200) {
            logger.info(`PUT video deletion date /event/:id/deletionDate VIDEO ${req.params.id} USER ${req.user.eppn} OK`);
            if (isoDbDeletionDate !== isoFormDeletionDate) {
                await dbService.clearNotificationSentAt(req.params.id, loggedUser);
            }
        } else if (response.status === 404){
            logger.warn(`PUT video deletion date /event/:id/deletionDate VIDEO ${req.params.id} USER ${req.user.eppn} ${response.statusText}`);
        }
        else {
            logger.error(`PUT video deletion date /event/:id/deletionDate VIDEO ${req.params.id} USER ${req.user.eppn} ${response.statusText}`);
        }

        res.status(response.status);
        res.json({message : response.statusText});
    } catch (error) {
        const msg = error.message;
        logger.error(`Error PUT /event/:id/deletionDate ${msg} VIDEO ${req.params.id} USER ${req.user.eppn}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DELETION_DATE,
            msg
        });
    }
};
