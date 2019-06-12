exports.filterApiChannelPublication = (publications) => {
    const filteredPublications = publications.filter(publication => {
        return publication.channel == 'api'
    });
    return filteredPublications;
};


exports.getMediaUrlFromPublication = (eventId , publication) => {
    const mediaUrl =  publication[0].media[0].url;
    return {id: eventId, url : mediaUrl};
}