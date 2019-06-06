const security = require('../config/security');

const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';

const OCAST_VIDEOS_FILTER_CREATOR = '?filter=Creator:';
const OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER = '?filter=series:'

exports.getEventsByIdentifier = async (identifier) => {
    let userEventsUrl = OCAST_VIDEOS_PATH + OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + identifier;
    const response =  await security.opencastBase.get(userEventsUrl);
    return response.data;
}

exports.allSeries = async () => {
    const response = await security.opencastBase.get(OCAST_SERIES_PATH);
    return response.data;
}

exports.userSeries = async (user) => {
    const userSeries = OCAST_SERIES_PATH + OCAST_VIDEOS_FILTER_CREATOR + user;
    const response = await security.opencastBase.get(userSeries);
    return response.data;
}

exports.allEvents = async () => {
    const response = await security.opencastBase.get(OCAST_VIDEOS_PATH);
    return response.data;
}





