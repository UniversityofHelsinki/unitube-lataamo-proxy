const security = require('../config/security');

const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';
const OCAST_USER_PATH = '/api/info/me'

const OCAST_SERIES_FILTER_CREATOR = '?filter=Creator:';
const OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER = '?filter=series:'

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




