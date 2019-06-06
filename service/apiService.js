const security = require('../config/security');

const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';

const OCAST_SERIES_FILTER_CREATOR = '?filter=Creator:';
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

exports.series = async () => {
    const seriesUrl = OCAST_SERIES_PATH + OCAST_SERIES_FILTER_CREATOR + process.env.LATAAMO_OPENCAST_USER;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
}

exports.allEvents = async () => {
    const response = await security.opencastBase.get(OCAST_VIDEOS_PATH);
    return response.data;
}





