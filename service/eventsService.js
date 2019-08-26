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
            "created": event.created
        })
    });
    return eventArray;
};

exports.calculateVisibilityProperty = (video) => {
    console.log(video.acls);
  return calculateVisibilityPropertyForVideo(video);
};

const calculateVisibilityPropertyForVideo = (video) => {
    const visibility = [];
    const publishedAcl = video.acls.filter(acl => acl.role === constants.ROLE_ANONYMOUS);
    const moodleAclInstructor = video.acls.filter(acl => acl.role.includes(constants.MOODLE_ACL_INSTRUCTOR));
    const moodleAclLearner = video.acls.filter(acl => acl.role.includes(constants.MOODLE_ACL_LEARNER));

    if (publishedAcl && publishedAcl.length > 0) {
        visibility.push(constants.STATUS_PUBLISHED);
    }

    if (moodleAclInstructor && moodleAclLearner && moodleAclInstructor.length > 0 && moodleAclLearner.length > 0) {
        visibility.push(constants.STATUS_MOODLE);
    }
    return [...new Set(visibility)]
}

exports.getAllEvents  = async (seriesIdentifiers) => {
    return await Promise.all(seriesIdentifiers.map(identifier => apiService.getEventsByIdentifier(identifier)));
};

exports.getAllEventsWithMetadatas = async (events) => {
    return Promise.all(events.map(async event => {
        const metadata = await apiService.getMetadataForEvent(event);
        return {
            ...event,
            metadata: metadata
        }
    }));
}

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
        let serie = seriesService.getSerieFromEventMetadata(metadata);
        let acls = await apiService.getEventAclsFromSerie(serie.value);
        return {
            ...event,
            acls : acls
        }
    }));
};

exports.getEventWithSerie = async (event) => {
    const metadata = await apiService.getMetadataForEvent(event);
    const serie = seriesService.getSerieFromEventMetadata(metadata);
    return {
        ...event,
        isPartOf : serie.value
    }
};

exports.modifyEventMetadataForOpencast = (metadata) => {
    const metadataArray = [];

    metadataArray.push({
            "id" : "title",
            "value": metadata.title },
        {
            "id" : "description",
            "value": metadata.description
        });

    return metadataArray;
};

exports.concatenateArray = (data) => Array.prototype.concat.apply([], data);


