'use strict';

const userService = require('../service/userService');
const eventsService = require('../service/eventsService');
const seriesService = require('../service/seriesService');
const apiService = require('../service/apiService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');
const { splitContributorsFromSeries, isContributorMigrationActive } = require('../utils/ocastMigrationUtils');


/**
 * Returns a series by series' id.
 *
 * HAXXX:
 * Before returning the series the series contributor values are checked
 * using splitContributorsFromSeries function in ocastMigrationUtils.js
 * @see module:ocastMigrationUtils
 *
 * Checks feature flag value FEATURE_FLAG_FOR_MIGRATION_ACTIVE
 * If value is not set (undefined) or the value is false the old implementation is used to get the series.
 *
 * See LATAAMO-510 for the discussion and details ({@link https://jira.it.helsinki.fi/browse/LATAAMO-510}).
 *
 * @param req
 * @param res
 * @returns {Promise<void>} The series found by series id
 */
exports.getSeries = async (req, res) => {
    try {
        const series = await apiService.getSeries(req.params.id);
        // check the feature flag value
        if (!isContributorMigrationActive()) {
            await apiService.contributorsToIamGroupsAndPersons(series);
        }else{
            await apiService.contributorsToIamGroupsAndPersons(
                splitContributorsFromSeries(series, req.user.eppn));
        }
        const seriesWithAllEventsCount = await eventsService.getAllEventsCountForSeries(series);
        const userSeriesWithPublished = await seriesService.addPublishedInfoInSeriesAndMoodleRoles(seriesWithAllEventsCount);
        res.json(userSeriesWithPublished);
    } catch (error) {
        const msg = error.message;
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_SERIES_DETAILS,
            msg
        });
    }
};


exports.updateSeries = async (req, res) => {
    try {
        const rawEventMetadata = req.body;
        const loggedUser = userService.getLoggedUser(req.user);
        seriesService.addUserToEmptyContributorsList(rawEventMetadata, loggedUser);
        let modifiedMetadata = eventsService.modifySeriesEventMetadataForOpencast(rawEventMetadata);
        let modifiedSeriesAclMetadata = seriesService.openCastFormatSeriesAclList(rawEventMetadata, constants.UPDATE_SERIES);
        const response = await apiService.updateSeriesAcldata(modifiedSeriesAclMetadata, req.body.identifier);
        const data = await apiService.updateSeriesEventMetadata(modifiedMetadata, req.body.identifier);
        res.json({message: 'OK'});
    } catch (error) {
        res.status(500);
        const msg = error.message;
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_DETAILS,
            msg
        });
    }
};

exports.getUserSeriesDropDownList = async (req, res) => {
    try {
        logger.info(`GET /userSeries USER: ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const userSeries = await apiService.getUserSeries(loggedUser);
        const userSeriesWithoutTrash = await seriesService.filterTrashSeries(userSeries);
        res.json(userSeriesWithoutTrash);
    } catch (error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error GET /userSeries ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_SERIES_LIST_FOR_USER,
            msg
        });
    }
};

exports.getUserSeries = async (req, res) => {
    try {
        logger.info(`GET /userSeries USER: ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const userSeries = await apiService.getUserSeries(loggedUser);
        const userSeriesWithoutTrash = await seriesService.filterTrashSeries(userSeries);
        const userSeriesWithoutInbox = await seriesService.filterInboxSeries(userSeriesWithoutTrash, loggedUser);
        const seriesWithAllEventsCount = await eventsService.getAllSeriesEventsCount(userSeriesWithoutInbox);
        const userSeriesWithPublicity = await seriesService.addPublicityStatusToSeries(seriesWithAllEventsCount);
        res.json(userSeriesWithPublicity);
    } catch (error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error GET /userSeries ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_SERIES_LIST_FOR_USER,
            msg
        });
    }
};

exports.createSeries = async (req, res) => {
    try {
        let series = req.body;
        const loggedUser = userService.getLoggedUser(req.user);
        let existsInbox = series.title.toLowerCase().includes(constants.INBOX);
        let existsTrash = series.title.toLowerCase().includes(constants.TRASH);

        if(existsInbox) {
            res.status(500);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED,
                msg: 'Inbox word is not allowed in series title'
            });
        }  else if(existsTrash){
            res.status(500);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_TRASH_NOT_ALLOWED,
                msg: 'trash word is not allowed in series title'
            });
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
};
