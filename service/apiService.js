const security = require('../config/security');

const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';
const OCAST_USER_PATH = '/api/info/me';
const OCAST_VIDEO_PUBLICATION_PATH = '/publications';
const OCAST_EVENT_MEDIA_PATH_PREFIX = '/admin-ng/event/';
const OCAST_EVENT_MEDIA_PATH_SUFFIX = '/asset/media/media.json';
const OCAST_EVENT_MEDIA_FILE_METADATA = '/asset/media/';

const OCAST_SERIES_FILTER_CREATOR = '?filter=Creator:';
const OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER = '?filter=series:';

exports.getUser = async () => {
    const apiUser = await security.opencastBase.get(OCAST_USER_PATH);
    return apiUser.data;
}

exports.getEventsByIdentifier = async (identifier) => {
    let userEventsUrl = OCAST_VIDEOS_PATH + OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + identifier;
    const response =  await security.opencastBase.get(userEventsUrl);
    return response.data;
}

exports.getSeriesForApiUser = async (apiUser) => {
    const seriesUrl = OCAST_SERIES_PATH + OCAST_SERIES_FILTER_CREATOR + apiUser.name;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
}

exports.getPublicationsForEvent = async (eventId) => {
    const publicationsUrl = OCAST_VIDEOS_PATH + eventId + OCAST_VIDEO_PUBLICATION_PATH;
    const response = await security.opencastBase.get(publicationsUrl);
    return response.data;
}

exports.getMediaForEvent = async (event) => {
    const mediaUrl = OCAST_EVENT_MEDIA_PATH_PREFIX + event.identifier + OCAST_EVENT_MEDIA_PATH_SUFFIX;
    const response = await security.opencastBase.get(mediaUrl);
    return response.data;
}

exports.getMediaFileMetadataForEvent = async (eventId, mediaId) => {
    const mediaFileMetadata = OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + OCAST_EVENT_MEDIA_FILE_METADATA + mediaId + '.json';
    const response = await security.opencastBase.get(mediaFileMetadata);
    return response.data;
}





