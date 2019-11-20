const commonService = require('./commonService');
const seriesService = require('./seriesService');
const apiService = require('./apiService');
const moment = require('moment');
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);
const constants = require('../utils/constants');
const {inboxSeriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions
const logger = require('../config/winstonLogger');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra

exports.filterEventsForClient = (ocResponseData) => {

    if(!ocResponseData){
        return [];
    }

    const eventArray = []
    ocResponseData.forEach(event => {
        eventArray.push({
            "identifier": event.identifier,
            "title": event.title,
            "duration": moment.duration(event.mediaFileMetadata.duration, 'milliseconds').format("hh:mm:ss", {trim:false}),
            "creator": event.creator,
            "processing_state" : event.processing_state,
            "visibility" : calculateVisibilityPropertyForVideo(event),
            "created": event.created,
            "series": event.series.title
        })
    });
    return eventArray;
};

exports.calculateVisibilityProperty = (event) => {
    return {
        ...event,
        visibility: calculateVisibilityPropertyForVideo(event)
    }
};

const calculateVisibilityPropertyForVideo = (video) => {
    const visibility = [];

    if (commonService.publicRoleCount(video.acls) === 2) { //video has both (constants.ROLE_ANONYMOUS, constants.ROLE_KATSOMO) roles
        visibility.push(constants.STATUS_PUBLISHED);
    } else {
        visibility.push(constants.STATUS_PRIVATE);
    }

    const moodleAclInstructor = video.acls.filter(acl => acl.role.includes(constants.MOODLE_ACL_INSTRUCTOR));
    const moodleAclLearner = video.acls.filter(acl => acl.role.includes(constants.MOODLE_ACL_LEARNER));

    if (moodleAclInstructor && moodleAclLearner && moodleAclInstructor.length > 0 && moodleAclLearner.length > 0) {
        visibility.push(constants.STATUS_MOODLE);
    }
    return [...new Set(visibility)]
};

exports.getAllEvents = async (seriesIdentifiers) => {
    return await Promise.all(seriesIdentifiers.map(identifier => apiService.getEventsByIdentifier(identifier)));
};

const getAllEventsWithSeries = async (series) => await Promise.all(series.map(series => apiService.getEventsWithSeriesByIdentifier(series)));

exports.getAllSeriesEventsCount = async (series) => await getAllEventsWithSeries(series);

exports.getAllEventsCountForSeries = async (series) => await apiService.getEventsWithSeriesByIdentifier(series);

exports.getAllEventsWithMetadatas = async (events) => {
    return Promise.all(events.map(async event => {
        const metadata = await apiService.getMetadataForEvent(event);
        return {
            ...event,
            metadata: metadata
        }
    }));
};

exports.getEventsWithMedia = async (events) => {
    return Promise.all(events.map(async event => {
        const media = await apiService.getMediaForEvent(event);
        return {
            ...event,
            media: media
        };
    }));
};

exports.getAllEventsWithMediaFileMetadata = async (events) => {
    return Promise.all(events.map(async event => {
        let mediaId =  event.media[0].id;
        const mediaFileMetadata = await apiService.getMediaFileMetadataForEvent(event.identifier, mediaId);
        return {
            ...event,
            mediaFileMetadata : mediaFileMetadata
        }
    }));
};

exports.getAllEventsWithAcls = async (events) => {
    return Promise.all(events.map(async event => {
        let metadata = event.metadata;
        let seriesField = seriesService.getSeriesFromEventMetadata(metadata);
        let acls = await apiService.getEventAclsFromSeries(seriesField.value);
        let series = await apiService.getSeries(seriesField.value);
        return {
            ...event,
            acls : acls,
            series : series
        }
    }));
};

exports.getLicenseFromEventMetadata = (event) => {
    const foundEpisodeFlavorMetadata = event.metadata.find(field => {
        return field.flavor === 'dublincore/episode';
    });
    const foundFieldWithLicenseInfo = foundEpisodeFlavorMetadata.fields.find(field => {
        return field.id === 'license';
    });
    return {
        ...event,
        license : foundFieldWithLicenseInfo ? foundFieldWithLicenseInfo.value : ''
    }
};

exports.getEventWithSeries = async (event) => {
    const metadata = await apiService.getMetadataForEvent(event);
    const seriesMetadata = seriesService.getSeriesFromEventMetadata(metadata);
    const series = await apiService.getSeries(seriesMetadata.value);
    return {
        ...event,
        isPartOf : seriesMetadata.value,
        series: series
    }
};

exports.getEventAclsFromSeries = async (eventWithSerie) => {
    const eventAcls = await apiService.getEventAclsFromSeries(eventWithSerie.isPartOf);
    return {
        ...eventWithSerie,
        acls : eventAcls
    }
};

exports.getMetadataForEvent = async (event) => {
    const metadata = await apiService.getMetadataForEvent(event);
    return {
        ...event,
        metadata: metadata
    }
};

exports.getMediaForEvent = async (event) => {
    const media = await apiService.getMediaForEvent(event);
    return {
        ...event,
        media: media
    }
};

exports.getMediaFileMetadataForEvent = async (event) => {
    let mediaId =  event.media[0].id;
    const mediaFileMetaData = await apiService.getMediaFileMetadataForEvent(event.identifier, mediaId);
    return {
        ...event,
        mediaFileMetadata : mediaFileMetaData
    }
};

exports.getDurationFromMediaFileMetadataForEvent = (event) => {
    return {
        ...event,
        duration: moment.duration(event.mediaFileMetadata.duration, 'milliseconds').format("hh:mm:ss", {trim:false})
    }
}

exports.modifyEventMetadataForOpencast = (metadata) => {
    const metadataArray = [];

    metadataArray.push(
        {
            "id" : "title",
            "value": metadata.title
        },
        {
            "id" : "description",
            "value": metadata.description
        }, {
            "id" : "isPartOf",
            "value" : metadata.isPartOf
        }, {
            "id": "license",
            "value": metadata.license
        });

    return metadataArray;
};

exports.modifySerieEventMetadataForOpencast = (metadata) => {
    const metadataArray = [];

    metadataArray.push({
            "id" : "title",
            "value": metadata.title },
        {
            "id" : "description",
            "value": metadata.description
        },
        {
            "id" : "contributor",
            "value": metadata.contributors
        }
    );

    return metadataArray;
};

exports.concatenateArray = (data) => Array.prototype.concat.apply([], data);

exports.inboxSeriesHandling = async (req, res, loggedUser, filePathOnDisk) => {
    try {
        let inboxSeries = await returnOrCreateUsersInboxSeries(loggedUser);
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
        return inboxSeries;
    } catch (err) {
        // Log error and throw reason
        console.log(err)
        throw "Failed to resolve user's inbox series";
    }
}

exports.uploadToOpenCast = async (req, res, inboxSeries, filePathOnDisk, filename, timeDiff) => {
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
}

// clean after post
const deleteFile = (filename) => {
    fs.unlink(filename, (err) => {
        if (err) {
            logger.error(`Failed to remove ${filename} | ${err}`);
        } else {
            logger.info(`Removed ${filename}`);
        }
    });
}

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