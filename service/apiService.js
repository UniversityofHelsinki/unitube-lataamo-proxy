let FormData = require('form-data');

const security = require('../config/security');

const OCAST_API_PATH = '/api/';
const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';
const OCAST_USER_PATH = '/api/info/me';
const OCAST_VIDEO_PUBLICATION_PATH = '/publications';
const OCAST_EVENT_MEDIA_PATH_PREFIX = '/admin-ng/event/';
const OCAST_EVENT_MEDIA_PATH_SUFFIX = '/asset/media/media.json';
const OCAST_EVENT_MEDIA_FILE_METADATA = '/asset/media/';
const OCAST_ACL_PATH = '/acl';
const OCAST_METADATA_PATH = '/metadata';
const OCAST_TYPE_QUERY_PARAMETER = '?type=';
const OCAST_TYPE_DUBLINCORE_EPISODE = 'dublincore/episode';

const OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER = '?filter=series:';

exports.getUser = async () => {
    const apiUser = await security.opencastBase.get(OCAST_USER_PATH);
    return apiUser.data;
};

exports.getEvent = async (identifier) => {
    let eventUrl = OCAST_VIDEOS_PATH + identifier;
    const response = await security.opencastBase.get(eventUrl);
    return response.data;
};

exports.getEventsByIdentifier = async (identifier) => {
    let userEventsUrl = OCAST_VIDEOS_PATH + OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + identifier;
    const response =  await security.opencastBase.get(userEventsUrl);
    return response.data;
};

exports.getAllSeries = async () => {
    const seriesUrl = OCAST_SERIES_PATH ;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
};

exports.getPublicationsForEvent = async (eventId) => {
    const publicationsUrl = OCAST_VIDEOS_PATH + eventId + OCAST_VIDEO_PUBLICATION_PATH;
    const response = await security.opencastBase.get(publicationsUrl);
    return response.data;
};

exports.getMediaForEvent = async (event) => {
    const mediaUrl = OCAST_EVENT_MEDIA_PATH_PREFIX + event.identifier + OCAST_EVENT_MEDIA_PATH_SUFFIX;
    const response = await security.opencastBase.get(mediaUrl);
    return response.data;
};

exports.getMediaFileMetadataForEvent = async (eventId, mediaId) => {
    const mediaFileMetadata = OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + OCAST_EVENT_MEDIA_FILE_METADATA + mediaId + '.json';
    const response = await security.opencastBase.get(mediaFileMetadata);
    return response.data;
};

exports.getEventAclsFromSerie = async (serie) => {
    const serieId = serie.value;
    let serieAclUrl = OCAST_SERIES_PATH + serieId + OCAST_ACL_PATH;
    const response = await security.opencastBase.get(serieAclUrl);
    return response.data;
};

exports.getMetadataForEvent = async (event) => {
    const metadata = OCAST_API_PATH + event.identifier + OCAST_METADATA_PATH;
    const response = await security.opencastBase.get(metadata);
    return response.data;
};

exports.updateVideoMetadata = async (metadata) => {
    const videoId = metadata.identifier;
    const videoMetaDataUrl = OCAST_VIDEOS_PATH + videoId + OCAST_METADATA_PATH + OCAST_TYPE_QUERY_PARAMETER + OCAST_TYPE_DUBLINCORE_EPISODE;
    let metadataArray = [
        {
            "id": "title",
            "value": "jeepajee"
        },
        {
            "id": "description",
            "value": "A great description 2"
        }
    ];

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadataArray));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };
        const response = await security.opencastBase.put(videoMetaDataUrl, bodyFormData, {headers});
        return response.data;
    } catch(error) {
        console.log(error);
        return response.error;
    }

}





