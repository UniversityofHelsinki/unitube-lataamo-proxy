const security = require('../config/security');
const FormData = require('form-data'); // https://www.npmjs.com/package/form-data
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const {format} = require('date-fns') // https://www.npmjs.com/package/date-fns
const constants = require('../utils/constants');
const {inboxSeriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions
const userService = require('./userService');

//
// This file is the façade for opencast server
//

exports.getUser = async () => {
    const apiUser = await security.opencastBase.get(constants.OCAST_USER_PATH);
    return apiUser.data;
};

exports.getEvent = async (identifier) => {
    let eventUrl = constants.OCAST_VIDEOS_PATH + identifier;
    const response = await security.opencastBase.get(eventUrl);
    return response.data;
};

exports.getEventsByIdentifier = async (identifier) => {
    let userEventsUrl = constants.OCAST_VIDEOS_PATH + constants.OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + identifier;
    const response = await security.opencastBase.get(userEventsUrl);
    return response.data;
};

exports.getSerie = async (serieId) => {
    const seriesUrl = constants.OCAST_SERIES_PATH + serieId;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
};

const doNotdropThese = 'grp-';

exports.removeSomeContributors = async (series) => {

    let res = []
    series.contributors.forEach(function (item) {
        if (item.startsWith(doNotdropThese)) {
            res.push(item);
        }
    })
    series.contributors = [...res];

    return res;
}

exports.updateSerieEventMetadata = async (metadata, id) => {
    const serieMetaDataUrl = constants.OCAST_SERIES_PATH + id + constants.OCAST_METADATA_PATH + constants.OCAST_TYPE_QUERY_PARAMETER + constants.OCAST_TYPE_DUBLINCORE_SERIES;

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadata));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };
        return await security.opencastBase.put(serieMetaDataUrl, bodyFormData, {headers});
    } catch (error) {
        console.log(error);
        //return response.error;  // response is undefined here!
        throw error;
    }
}

exports.updateSeriesAcldata = async (acl, id) => {
    const seriesAclUrl = constants.OCAST_SERIES_PATH + id + constants.OCAST_ACL_PATH;

    let bodyFormData = new FormData();
    bodyFormData.append('acl', JSON.stringify(acl));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };
        const response = await security.opencastBase.put(seriesAclUrl, bodyFormData, {headers});
        return response.data;
    } catch (error) {
        console.log(error);
        //return response.error;  // response is undefined here!
        throw error;
    }
}

exports.getSeriesAcldata = async (id) => {
    const seriesAclUrl = constants.OCAST_SERIES_PATH + id + constants.OCAST_ACL_PATH;
    try {
        const response = await security.opencastBase.get(seriesAclUrl);
        return response.data;
    } catch (error) {
        console.log(error);
        //return response.error;  // response is undefined here!
        throw error;
    }
}

exports.getUserSeries = async (user) => {

    const conributorParameters = userService.parseContributor(user.hyGroupCn);
    const seriesUrl = constants.OCAST_SERIES_PATH + '?filter=contributors:' + user.eppn + ',' + conributorParameters;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
};

exports.getPublicationsForEvent = async (eventId) => {
    const publicationsUrl = constants.OCAST_VIDEOS_PATH + eventId + constants.OCAST_VIDEO_PUBLICATION_PATH;
    const response = await security.opencastBase.get(publicationsUrl);
    return response.data;
};

exports.getMediaForEvent = async (event) => {
    const mediaUrl = constants.OCAST_EVENT_MEDIA_PATH_PREFIX + event.identifier + constants.OCAST_EVENT_MEDIA_PATH_SUFFIX;
    const response = await security.opencastBase.get(mediaUrl);
    return response.data;
};

exports.getMediaFileMetadataForEvent = async (eventId, mediaId) => {
    const mediaFileMetadata = constants.OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + constants.OCAST_EVENT_MEDIA_FILE_METADATA + mediaId + '.json';
    const response = await security.opencastBase.get(mediaFileMetadata);
    return response.data;
};

exports.getEventAclsFromSerie = async (serie) => {
    const serieId = serie;
    let serieAclUrl = constants.OCAST_SERIES_PATH + serieId + constants.OCAST_ACL_PATH;
    const response = await security.opencastBase.get(serieAclUrl);
    return response.data;
};

exports.getMetadataForEvent = async (event) => {
    const metadata = constants.OCAST_API_PATH + event.identifier + constants.OCAST_METADATA_PATH;
    const response = await security.opencastBase.get(metadata);
    return response.data;
};

exports.updateEventMetadata = async (metadata, id) => {
    const videoMetaDataUrl = constants.OCAST_VIDEOS_PATH + id + constants.OCAST_METADATA_PATH + constants.OCAST_TYPE_QUERY_PARAMETER + constants.OCAST_TYPE_DUBLINCORE_EPISODE;
    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadata));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };
        const response = await security.opencastBase.put(videoMetaDataUrl, bodyFormData, {headers});
        return response.data;
    } catch (error) {
        console.log(error);
        //return response.error;  // response is undefined here!
        throw error;
    }
};

exports.createSeries = async (user, seriesMetadata, seriesAcl) => {
    const seriesUploadUrl = constants.OCAST_SERIES_PATH;
    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(seriesMetadata));
    bodyFormData.append('acl', JSON.stringify(seriesAcl));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };
        const response = await security.opencastBase.post(seriesUploadUrl, bodyFormData, {headers});
        console.log('series uploaded: ', response.data);
        return response;
    } catch (err) {
        throw err;
    }

}


// on success returns status code 201 and payload:
// {
//     "identifier": "9ad24ff8-abda-4681-8f02-184b49364677"
// }
// from opencast server
exports.uploadVideo = async (filePathOnDisk, videoFilename, inboxUserSeriesId) => {
    const videoUploadUrl = constants.OCAST_VIDEOS_PATH;
    const videoDescription = 'TEMPORARY DESCRIPTION, PLEASE UPDATE'
    const startDate = format(new Date(), 'yyyy-MM-dd') // '2016-06-22'
    const startTime = format(new Date(), 'pp') // '10:03:52 AM'
    const inboxSeriesId = inboxUserSeriesId;  // User's INBOX series id

    // refactor this array to constants.js
    const metadataArray = [
        {
            "flavor": "dublincore/episode",
            "fields": [
                {
                    "id": "title",
                    "value": videoFilename
                },
                {
                    "id": "subjects",
                    "value": []
                },
                {
                    "id": "description",
                    "value": videoDescription
                },
                {
                    "id": "startDate",
                    "value": startDate
                },
                {
                    "id": "startTime",
                    "value": startTime
                },
                {
                    "id": "isPartOf",
                    "type": "text",
                    "value": inboxSeriesId
                }
            ]
        }
    ];
    // these are now constant values, maybe should be editable
    const acls = constants.SERIES_ACL_TEMPLATE;
    const processingMetadata = constants.PROCESSING_METADATA;

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadataArray));
    bodyFormData.append('acl', JSON.stringify(acls));
    bodyFormData.append('processing', JSON.stringify(processingMetadata));
    // https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options
    bodyFormData.append('presenter', fs.createReadStream(filePathOnDisk));

    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Disposition": "multipart/form-data",
            "Content-Type": "application/x-www-form-urlencoded"
        };
        // do we want to wait ocast's reponse?
        const response = await security.opencastBase.post(videoUploadUrl, bodyFormData, {headers});
        console.log('video uploaded: ', response.data);
        return response;
    } catch (err) {
        throw err;
    }
}


// create the default lataamo INBOX series for the given userId
exports.createLataamoInboxSeries = async (userId) => {
    console.log('creating inbox series for', userId);

    const lataamoInboxSeriesTitle = inboxSeriesTitleForLoggedUser(userId);
    const lataamoInboxSeriesDescription = `Lataamo-INBOX series for ${ userId }`;
    const lataamoInboxSeriesLicense = 'PUT HERE THE DEFAULT INBOX SERIES LICENSE';
    const lataamoInboxSeriesLanguage = 'en';
    const lataamoInboxSeriesCreator = 'Lataamo-proxy-service';
    const lataamoInboxSeriesSubject = 'Lataamo-INBOX';
    const seriesUrl = constants.OCAST_SERIES_PATH;

    metadataArray = [
        {
            "flavor": "dublincore/series",
            "title": "Opencast Series DublinCore",
            "fields": [
                {
                    "readOnly": false,
                    "id": "title",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.TITLE",
                    "type": "text",
                    "value": lataamoInboxSeriesTitle,
                    "required": true
                },
                {
                    "readOnly": false,
                    "id": "subjects",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.SUBJECT",
                    "type": "text",
                    "value": [
                        lataamoInboxSeriesSubject
                    ],
                    "required": false
                },
                {
                    "readOnly": false,
                    "id": "description",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.DESCRIPTION",
                    "type": "text",
                    "value": lataamoInboxSeriesDescription,
                    "required": false
                },
                {
                    "translatable": true,
                    "readOnly": false,
                    "id": "language",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.LANGUAGE",
                    "type": "text",
                    "value": lataamoInboxSeriesLanguage,
                    "required": false
                },
                {
                    "readOnly": false,
                    "id": "rightsHolder",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.RIGHTS",
                    "type": "text",
                    "value": userId,
                    "required": false
                },
                {
                    "translatable": true,
                    "readOnly": false,
                    "id": "license",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.LICENSE",
                    "type": "text",
                    "value": lataamoInboxSeriesLicense,
                    "required": false
                },
                {
                    "translatable": false,
                    "readOnly": false,
                    "id": "creator",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.CREATED_BY",
                    "type": "mixed_text",
                    "value": [
                        lataamoInboxSeriesCreator, userId
                    ],
                    "required": false
                },
                {
                    "translatable": false,
                    "readOnly": false,
                    "id": "contributor",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.CONTRIBUTORS",
                    "type": "mixed_text",
                    "value": [userId],
                    "required": false
                },
                {
                    "translatable": false,
                    "readOnly": false,
                    "id": "publisher",
                    "label": "EVENTS.SERIES.DETAILS.METADATA.PUBLISHERS",
                    "type": "mixed_text",
                    "value": [userId],
                    "required": false
                }
            ]
        }
    ];

    // these are now constant values, maybe should be editable
    const acls = constants.SERIES_ACL_TEMPLATE;

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadataArray));
    bodyFormData.append('acl', JSON.stringify(acls));

    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Type": "application/x-www-form-urlencoded"
        };

        const response = await security.opencastBase.post(seriesUrl, bodyFormData, {headers});
        console.log('Inbox series created: ', response.data);
        return response.data;
    } catch (err) {
        throw err;
    }

};