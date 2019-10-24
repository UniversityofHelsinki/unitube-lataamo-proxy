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

exports.getSerie = async (seriesId) => {
    const seriesUrl = constants.OCAST_SERIES_PATH + seriesId;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
};

exports.getInboxSeries = async (user, seriesTitle) => {
    const contributorParameters = userService.parseContributor(user.hyGroupCn);
    const seriesUrl = constants.OCAST_SERIES_PATH + '?filter=contributors:' + user.eppn + ',' + contributorParameters;
    const response = await security.opencastBase.get(seriesUrl);
    const seriesTitles = response.data.map(series => series.title);

    return seriesTitle==="inbox " + user.eppn && seriesTitles.includes(seriesTitle);

};

const addToIamGroups = ['grp-', 'hy-', 'sys-'];

exports.contributorsToIamGroupsAndPersons = async (series) => {
    let iamgroups = [];
    let persons = [];

    series.contributors.forEach(function (item) {
        const match = addToIamGroups.filter(entry => item.includes(entry));
        if (match && match.length > 0) {
            iamgroups.push(item);
        } else {
            persons.push(item);
        }
    })
    series.iamgroups = [...iamgroups];
    series.persons = [...persons];
};

exports.updateSerieEventMetadata = async (metadata, id) => {
    const seriesMetaDataUrl = constants.OCAST_SERIES_PATH + id + constants.OCAST_METADATA_PATH + constants.OCAST_TYPE_QUERY_PARAMETER + constants.OCAST_TYPE_DUBLINCORE_SERIES;

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadata));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };
        return await security.opencastBase.put(seriesMetaDataUrl, bodyFormData, {headers});
    } catch (error) {
        console.log(error);
        //return response.error;  // response is undefined here!
        throw error;
    }
};

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
};

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
};

exports.getUserSeries = async (user) => {

    const contributorParameters = userService.parseContributor(user.hyGroupCn);
    const seriesUrl = constants.OCAST_SERIES_PATH + '?filter=contributors:' + user.eppn + ',' + contributorParameters;
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

exports.getEventAclsFromSerie = async (series) => {
    const seriesId = series;
    let seriesAclUrl = constants.OCAST_SERIES_PATH + seriesId + constants.OCAST_ACL_PATH;
    const response = await security.opencastBase.get(seriesAclUrl);
    return response.data;
};

exports.getMetadataForEvent = async (event) => {
    const metadata = constants.OCAST_API_PATH + event.identifier + constants.OCAST_METADATA_PATH;
    const response = await security.opencastBase.get(metadata);
    return response.data;
};

exports.updateEventMetadata = async (metadata, eventId) => {
    const videoMetaDataUrl = constants.OCAST_VIDEOS_PATH + eventId + constants.OCAST_METADATA_PATH + constants.OCAST_TYPE_QUERY_PARAMETER + constants.OCAST_TYPE_DUBLINCORE_EPISODE;

    // republish paths
    const republishMetadataUrl = '/workflow/start';
    const mediaPackageUrl = '/assets/episode/' + eventId;

    try {
        let bodyFormData = new FormData();
        bodyFormData.append('metadata', JSON.stringify(metadata));

        let headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };
        // update event metadata
        const response = await security.opencastBase.put(videoMetaDataUrl, bodyFormData, {headers});

        // let's break if response from PUT not ok
        if(response.status !== 204){
            console.log(error);
            throw error;
        }

        // get mediaPackage for the republish query
        const mediaPackageJson = await security.opencastBase.get(mediaPackageUrl);

        // form data for the republish request
        bodyFormData = new FormData();
        bodyFormData.append('definition', 'republish-metadata');
        bodyFormData.append('mediapackage', mediaPackageJson.data);
        bodyFormData.append('properties', constants.PROPERTIES_REPUBLISH_METADATA);

        headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync()
        };

        // do the republish request
        const resp = await security.opencastBase.post(republishMetadataUrl, bodyFormData, {headers});

        return resp;
    } catch (error) {
        console.log(error);
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
        return response;
    } catch (err) {
        throw err;
    }

};


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
        return response;
    } catch (err) {
        throw err;
    }
};


// create the default lataamo INBOX series for the given userId
exports.createLataamoInboxSeries = async (userId) => {
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
        return response.data;
    } catch (err) {
        throw err;
    }

};