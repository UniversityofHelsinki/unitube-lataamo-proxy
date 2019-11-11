const commonService = require('./commonService');
const seriesService = require('./seriesService');
const apiService = require('./apiService');
const moment = require('moment');
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);
const constants = require('../utils/constants');


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
    const serie = seriesService.getSeriesFromEventMetadata(metadata);
    return {
        ...event,
        isPartOf : serie.value
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


