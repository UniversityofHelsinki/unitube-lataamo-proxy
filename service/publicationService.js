exports.filterApiChannelPublication = (publications) => {
    const filteredPublications = publications.filter(publication => {
        return publication.channel == 'api'
    });
    return filteredPublications;
};


exports.getMediaUrlsFromPublication = (eventId , publication) => {
    let mediaUrls = [];
    publication[0].media.some(media =>  {
        mediaUrls.push({id: eventId, url: media.url})
    });
    return mediaUrls;
}