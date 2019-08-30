const security = require('../config/security');

const FormData = require('form-data'); // https://www.npmjs.com/package/form-data
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const { format } = require('date-fns') // https://www.npmjs.com/package/date-fns
const constants = require('../utils/constants');


exports.getUser = async () => {
    const apiUser = await security.opencastBase.get(constants.OCAST_USER_PATH);
    return apiUser.data;
}

exports.getEvent = async (identifier) => {
    let eventUrl = constants.OCAST_VIDEOS_PATH + identifier;
    const response = await security.opencastBase.get(eventUrl);
    return response.data;
}

exports.getEventsByIdentifier = async (identifier) => {
    let userEventsUrl = constants.OCAST_VIDEOS_PATH + constants.OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + identifier;
    const response =  await security.opencastBase.get(userEventsUrl);
    return response.data;
}

exports.getAllSeries = async () => {
    const seriesUrl = constants.OCAST_SERIES_PATH ;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
}

exports.getPublicationsForEvent = async (eventId) => {
    const publicationsUrl = constants.OCAST_VIDEOS_PATH + eventId + constants.OCAST_VIDEO_PUBLICATION_PATH;
    const response = await security.opencastBase.get(publicationsUrl);
    return response.data;
}

exports.getMediaForEvent = async (event) => {
    const mediaUrl = constants.OCAST_EVENT_MEDIA_PATH_PREFIX + event.identifier + constants.OCAST_EVENT_MEDIA_PATH_SUFFIX;
    const response = await security.opencastBase.get(mediaUrl);
    return response.data;
}

exports.getMediaFileMetadataForEvent = async (eventId, mediaId) => {
    const mediaFileMetadata = constants.OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + constants.OCAST_EVENT_MEDIA_FILE_METADATA + mediaId + '.json';
    const response = await security.opencastBase.get(mediaFileMetadata);
    return response.data;
}

exports.getEventAclsFromSerie = async (serie) => {
    const serieId = serie.value;
    let serieAclUrl = constants.OCAST_SERIES_PATH + serieId + constants.OCAST_ACL_PATH;
    const response = await security.opencastBase.get(serieAclUrl);
    return response.data;
};

exports.getMetadataForEvent = async (event) => {
    const metadata = constants.OCAST_API_PATH + event.identifier + constants.OCAST_METADATA_PATH;
    const response = await security.opencastBase.get(metadata);
    return response.data;
}


// on success returns status code 201 and payload:
// {
//     "identifier": "9ad24ff8-abda-4681-8f02-184b49364677"
// }
// from opencast server
exports.uploadVideo = async (filePathOnDisk, videoFilename, inboxUserSeries) => {
    const videoUploadUrl = constants.OCAST_VIDEOS_PATH;
    const videoDescription = 'TEMPORARY DESCRIPTION, PLEASE UPDATE'
    const startDate = format(new Date(), 'yyyy-MM-dd') // '2016-06-22'
    const startTime = format(new Date(), 'pp') //'10:03:52 AM'
    const inboxSeriesId = inboxUserSeries.identifier;  // User's INBOX series id

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
    const acls = constants.ACL_ARRAY;
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
    } catch(err) {
        throw Error('*** Error in video upload **** ', err);
    }
}

