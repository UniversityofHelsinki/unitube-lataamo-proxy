const security = require('../config/security');

const FormData = require('form-data'); // https://www.npmjs.com/package/form-data
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const { format } = require('date-fns') // https://www.npmjs.com/package/date-fns

const OCAST_API_PATH = '/api/';
const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';
const OCAST_USER_PATH = '/api/info/me';
const OCAST_VIDEO_PUBLICATION_PATH = '/publications';
const OCAST_EVENT_MEDIA_PATH_PREFIX = '/admin-ng/event/';
const OCAST_EVENT_MEDIA_PATH_SUFFIX = '/asset/media/media.json';
const OCAST_EVENT_MEDIA_FILE_METADATA = '/asset/media/';
const OCAST_ACL_PATH = '/acl';
const OCAST_METADATA_PATH = '/metadata';

const OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER = '?filter=series:';

exports.getUser = async () => {
    const apiUser = await security.opencastBase.get(OCAST_USER_PATH);
    return apiUser.data;
}

exports.getEvent = async (identifier) => {
    let eventUrl = OCAST_VIDEOS_PATH + identifier;
    const response = await security.opencastBase.get(eventUrl);
    return response.data;
}

exports.getEventsByIdentifier = async (identifier) => {
    let userEventsUrl = OCAST_VIDEOS_PATH + OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + identifier;
    const response =  await security.opencastBase.get(userEventsUrl);
    return response.data;
}

exports.getAllSeries = async () => {
    const seriesUrl = OCAST_SERIES_PATH ;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
}

exports.getPublicationsForEvent = async (eventId) => {
    const publicationsUrl = OCAST_VIDEOS_PATH + eventId + OCAST_VIDEO_PUBLICATION_PATH;
    const response = await security.opencastBase.get(publicationsUrl);
    return response.data;
}

exports.getMediaForEvent = async (event) => {
    const mediaUrl = OCAST_EVENT_MEDIA_PATH_PREFIX + event.identifier + OCAST_EVENT_MEDIA_PATH_SUFFIX;
    const response = await security.opencastBase.get(mediaUrl);
    return response.data;
}

exports.getMediaFileMetadataForEvent = async (eventId, mediaId) => {
    const mediaFileMetadata = OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + OCAST_EVENT_MEDIA_FILE_METADATA + mediaId + '.json';
    const response = await security.opencastBase.get(mediaFileMetadata);
    return response.data;
}

exports.getEventAclsFromSerie = async (serie) => {
    const serieId = serie.value;
    let serieAclUrl = OCAST_SERIES_PATH + serieId + OCAST_ACL_PATH;
    const response = await security.opencastBase.get(serieAclUrl);
    return response.data;
};

exports.getMetadataForEvent = async (event) => {
    const metadata = OCAST_API_PATH + event.identifier + OCAST_METADATA_PATH;
    const response = await security.opencastBase.get(metadata);
    return response.data;
}


// on success status code 201 and payload:
// {
//     "identifier": "9ad24ff8-abda-4681-8f02-184b49364677"
// }
exports.uploadVideo = async (filePathOnDisk, videoFilename) => {
    const videoUploadUrl = OCAST_VIDEOS_PATH;
    const videoDescription = 'TEMPORARY DESCRIPTION, PLEASE UPDATE'
    const startDate = format(new Date(), 'yyyy-MM-dd') // "2016-06-22"; 
    const startTime = format(new Date(), 'pp') //"13:30:00Z";  
    const inboxSeriesId = usersInboxSeriesId();  // User's INBOX series id

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

    const aclArray = [
        {
          "action": "read",
          "allow": true,  
          "role": "ROLE_USER_ADMIN"
        },
        {
          "action": "write",
          "allow": true,
          "role": "ROLE_USER_ADMIN"
        },
        {
          "action": "read",
          "allow": true,
          "role": "ROLE_ADMIN"
        },
        {
          "action": "write",
          "allow": true,
          "role": "ROLE_ADMIN"
        },
        {
          "action": "read",
          "allow": true,
          "role": "ROLE_ANONYMOUS"
        }
      ]

    const processingMetadata = {
        "workflow": "schedule-and-upload",
        "configuration": {
          "flagForCutting": "false",
          "flagForReview": "true",
          "publishToEngage": "true",
          "publishToHarvesting": "true",
          "straightToPublishing": "true"
        }
      }  

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadataArray));
    bodyFormData.append('acl', JSON.stringify(aclArray));
    bodyFormData.append('processing', JSON.stringify(processingMetadata));
    // https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
    bodyFormData.append('presenter', fs.readFileSync(filePathOnDisk)); 
    
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            "Content-Length": bodyFormData.getLengthSync(),
            "Content-Disposition": "multipart/form-data"
        };
        const response = await security.opencastBase.post(videoUploadUrl, bodyFormData, {headers});
        console.log('video uploaded: ', response.data);
        return response;
    } catch(err) {
        throw Error('*** Error in video upload **** ', err);
    }
}

function usersInboxSeriesId(){
    return "dabbb475-b930-4b7f-8be9-3d0ac67768cf";
}

// const videoFileFromDisk = async (path) => {
//     // https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback
//     fs.readFile(path, (err, data) => {
//         if (err) throw err;
//         return data;
//       });
// }