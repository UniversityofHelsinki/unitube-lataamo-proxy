const seriesService = require('./seriesService');
const apiService = require('./apiService');
const moment = require('moment');
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);

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
            "acls" : event.acls
        })
    });
    return eventArray;
};

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
        let acls = await apiService.getEventAclsFromSerie(serie);
        return {
            ...event,
            acls : acls
        }
    }));
};

exports.concatenateArray = (data) => Array.prototype.concat.apply([], data);


