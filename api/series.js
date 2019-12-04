'use strict';

const userService = require('../service/userService');
const eventsService = require('../service/eventsService');
const seriesService = require('../service/seriesService');
const apiService = require('../service/apiService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');

exports.getSeries = async (req, res) => {
    try {
        const series = await apiService.getSeries(req.params.id);
        await apiService.contributorsToIamGroupsAndPersons(series);
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
        let modifiedMetadata = eventsService.modifySerieEventMetadataForOpencast(rawEventMetadata);
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
        })
    }
};

exports.getUserSeriesDropDownList = async (req, res) => {
    try {
        logger.info(`GET /userSeries USER: ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const userSeries = await apiService.getUserSeries(loggedUser);
        res.json(userSeries);
    } catch (error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error GET /userSeries ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_SERIES_LIST_FOR_USER,
            msg
        })
    }
};

exports.getUserSeries = async (req, res) => {
    try {
        logger.info(`GET /userSeries USER: ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const userSeries = await apiService.getUserSeries(loggedUser);
        const userSeriesWithoutTrash = await seriesService.filterTrashSeries(userSeries);
        const userSeriesWithoutInbox = await seriesService.filterInboxSeries(userSeriesWithoutTrash);
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
        })
    }
};

exports.createSeries = async (req, res) => {
    try {
        let series = req.body;
        const loggedUser = userService.getLoggedUser(req.user);
        let exists = series.title.toLowerCase().includes('inbox');

        if(exists){
            res.status(403);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED,
                msg: 'Inbox word is not allowed in series title'
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
