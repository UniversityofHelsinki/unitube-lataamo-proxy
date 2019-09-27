const constants = require('../utils/constants');

exports.filterApiChannelPublication = (publications) => {
    const filteredPublications = publications.filter(publication => {
        return publication.channel == 'api'
    });
    return filteredPublications;
};

const filterOnlyHighestQualityPublication = (mediaArray) => {
    let allMedias = [];
    let mediaPresenterDelivery = [];
    let mediaPresentationDelivery = [];

    let mediaPresenterObject = {};
    let mediaPresentationObject = {};

    mediaArray.some(media =>  {
        if (media.flavor === constants.VIDEO_PRESENTER_DELIVERY) {
            mediaPresenterDelivery.push(media);
        }
        if (media.flavor === constants.VIDEO_PRESENTATION_DELIVERY) {
            mediaPresentationDelivery.push(media);
        }
    });

    if (mediaPresenterDelivery && mediaPresenterDelivery.length > 1) {
        mediaPresenterObject = mediaPresenterDelivery.reduce((maxPresenterHeight, media) => {
            return media.height > maxPresenterHeight.height ? media : maxPresenterHeight;
        });
    } else {
        mediaPresenterObject = mediaPresenterDelivery[0];
    }

    if (mediaPresentationDelivery && mediaPresentationDelivery.length > 1) {
        mediaPresentationObject = mediaPresentationDelivery.reduce((maxPresentationHeight, media) => {
            return media.height > maxPresentationHeight.height ? media : maxPresentationHeight;
        });
    } else {
        mediaPresentationObject = mediaPresentationDelivery[0];
    }

    if (mediaPresenterObject && mediaPresenterObject.url) {
        allMedias.push(mediaPresenterObject);
    }

    if (mediaPresentationObject && mediaPresentationObject.url) {
        allMedias.push(mediaPresentationObject);
    }

    return allMedias;
};

exports.getMediaUrlsFromPublication = (eventId , publication) => {
    let mediaUrls = [];
    let filteredMedias = [];
    if (publication[0].media && publication[0].media.length > 0) {
       filteredMedias = filterOnlyHighestQualityPublication(publication[0].media);
       if (filteredMedias && filteredMedias.length > 0) {
           filteredMedias.some(media =>  {
               mediaUrls.push({id: eventId, url: media.url})
           });
       }
    } else {
        mediaUrls.push({id: eventId, url: ''})
    }
    return mediaUrls;
}