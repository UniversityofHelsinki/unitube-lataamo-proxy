const apiService = require('./apiService');

exports.filterEventsForClient = (ocResponseData) => {

    if(!ocResponseData){
        return [];
    }

    const eventArray = []
    ocResponseData.forEach(event => {
        eventArray.push({
            "identifier": event.identifier,
            "title": event.title,
            "duration": event.duration,
            "creator": event.creator
        })
    });
    return eventArray;
}


exports.getAllEvents  = async (seriesIdentifiers) => {
    return await Promise.all(seriesIdentifiers.map(identifier => apiService.getEventsByIdentifier(identifier)));
}

exports.concatenateArray = (data) => Array.prototype.concat.apply([], data);


