const constants = require('../utils/constants');
const moment = require('moment');

exports.filterEngagePlayerChannelPublication = (publications) => {
    const filteredPublications = publications.filter(publication => {
        return publication.channel == 'engage-player';
    });
    return filteredPublications;
};

const filterMediaTypes = (mediaArray, mediaPresenterDelivery, mediaPresentationDelivery) => {
    mediaArray.some(media => {
        if (media.flavor === constants.VIDEO_PRESENTER_DELIVERY) {
            mediaPresenterDelivery.push(media);
        }
        if (media.flavor === constants.VIDEO_PRESENTATION_DELIVERY) {
            mediaPresentationDelivery.push(media);
        }
    });
};

const filterHighestQualityMediaObject = (mediaArray, mediaObject) => {
    if (mediaArray) {
        if (mediaArray.length > 1)
            mediaObject = mediaArray.reduce((maxObjectHeight, media) => {
                return media.height > maxObjectHeight.height ? media : maxObjectHeight;
            });
        else {
            mediaObject = mediaArray[0];
        }
    }
    return mediaObject;
};

const filterOnlyHighestQualityPublications = (mediaArray) => {
    let allMedias = [];
    let mediaPresenterDelivery = [];
    let mediaPresentationDelivery = [];

    let mediaPresenterObject = {};
    let mediaPresentationObject = {};

    filterMediaTypes(mediaArray, mediaPresenterDelivery, mediaPresentationDelivery);

    mediaPresenterObject = filterHighestQualityMediaObject(mediaPresenterDelivery, mediaPresenterObject);

    mediaPresentationObject = filterHighestQualityMediaObject(mediaPresentationDelivery, mediaPresentationObject);

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
        filteredMedias = filterOnlyHighestQualityPublications(publication[0].media);
        if (filteredMedias && filteredMedias.length > 0) {
            filteredMedias.some(media =>  {
                mediaUrls.push({id: eventId, url: media.url, duration: moment.duration(media.duration, 'milliseconds').format('HH:mm:ss', {trim:false}), resolution: `${media.width}x${media.height}`});
            });
        }
    } else {
        mediaUrls.push({id: eventId, url: '', duration: '', resolution: ''});
    }
    return mediaUrls;
};
