const constants = require('../utils/constants');
const moment = require('moment');
const {encrypt} = require("../utils/encrption");

exports.filterEngagePlayerChannelPublication = (publications) => {
    const filteredPublications = publications.filter(publication => {
        return publication.channel == 'engage-player';
    });
    return filteredPublications;
};

const filterPublicationWithMediaArrayFromPublications = (publications) => {
    const filteredMediaArray = publications.filter(publication => {
        return publication.media != null && publication.media.length > 0;
    });
    return filteredMediaArray;
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

const isPrimaryVideo = (media) => {
    if (media && media.flavor) {
        return media.flavor === constants.VIDEO_PRESENTER_DELIVERY;
    } else {
        return;
    }
};

const getCoverImage = (media, publication) => {
    const primaryVideo = isPrimaryVideo(media);
    for (publication of publication) {
        if (publication.attachments && publication.attachments.length > 0) {
            for (const attachment of publication.attachments) {
                if (primaryVideo) {
                    if (attachment.flavor && attachment.flavor === constants.PRESENTER_FLAVOR_FOR_VIDEO_THUMBNAIL) {
                        return encrypt(attachment.url);
                    }
                } else {
                    if (attachment.flavor && attachment.flavor === constants.PRESENTATION_FLAVOR_FOR_VIDEO_THUMBNAIL) {
                        return encrypt(attachment.url);
                    }
                }
            }
        }
    }
};

exports.getMediaUrlsFromPublication = (eventId , publication) => {
    let mediaUrls = [];
    let filteredMedias = [];
    let filteredPublication = filterPublicationWithMediaArrayFromPublications(publication);
    if (filteredPublication && filteredPublication[0] && filteredPublication[0].media) {
        filteredMedias = filterOnlyHighestQualityPublications(filteredPublication[0].media);
        if (filteredMedias && filteredMedias.length > 0) {
            filteredMedias.some(media =>  {
                mediaUrls.push({id: eventId, url: media.url, duration: moment.duration(media.duration, 'milliseconds').format('HH:mm:ss', {trim:false}), resolution: `${media.width}x${media.height}`, coverImage: getCoverImage(media, filteredPublication)});
            });
        }
    } else {
        mediaUrls.push({id: eventId, url: '', duration: '', resolution: ''});
    }
    return mediaUrls;
};
