const security = require('../config/security');
const FormData = require('form-data'); // https://www.npmjs.com/package/form-data
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const { zonedTimeToUtc } = require('date-fns-tz');
const constants = require('../utils/constants');
const {seriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions
const logger = require('../config/winstonLogger');
const eventsService = require('./eventsService');
const messageKeys = require('../utils/message-keys');
const fetch = require('node-fetch');
const { parseContributor } = require('./userService');
const { filterCorrectSeriesWithCorrectContributors, transformResponseData, isContributorMigrationActive } =
    require('../utils/ocastMigrationUtils');

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

exports.getEventsBySeriesIdentifier = async (identifier) => {
    let userEventsUrl = constants.OCAST_VIDEOS_PATH + constants.OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + identifier + constants.OCAST_VIDEOS_WITH_METADATA_ACLS_AND_PUBLICATIONS;
    console.log(userEventsUrl, new Date());
    const response = await security.opencastBase.get(userEventsUrl);
    return response.data;
};

exports.getEventsWithSeriesByIdentifier = async (series) => {
    let userEventsUrl = constants.OCAST_VIDEOS_PATH + constants.OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER;
    userEventsUrl = userEventsUrl + series.identifier;
    const response = await security.opencastBase.get(userEventsUrl);
    const events = response.data;
    return {
        ...series,
        eventsCount: events.length,
        eventColumns: someEventColumns(events)
    };
};

const someEventColumns = (events) => {
    let eventData = [];
    events.map(({title, identifier}) => {
        eventData.push({'title': title, 'id': identifier});
    });
    return eventData;
};

exports.getSeries = async (seriesId) => {
    const seriesUrl = constants.OCAST_SERIES_PATH + seriesId;
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
};

exports.contributorsToIamGroupsAndPersons = async (series) => {
    let iamgroups = [];
    let persons = [];

    series.contributors.forEach(function (item) {
        const match = constants.ADD_TO_IAM_GROUPS.filter(entry => item.includes(entry));
        if (match && match.length > 0) {
            iamgroups.push(item);
        } else {
            persons.push(item);
        }
    });
    series.iamgroups = [...iamgroups];
    series.persons = [...persons];
};

exports.updateSeriesEventMetadata = async (metadata, id) => {
    const seriesMetaDataUrl = constants.OCAST_SERIES_PATH + id + constants.OCAST_METADATA_PATH + constants.OCAST_TYPE_QUERY_PARAMETER + constants.OCAST_TYPE_DUBLINCORE_SERIES;

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadata));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            'Content-Length': bodyFormData.getLengthSync()
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
            'Content-Length': bodyFormData.getLengthSync()
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

exports.getUserSeriesWithPrefix = async (seriesPrefix, user ) => {
    const seriesUrl = constants.OCAST_SERIES_PATH + constants.OCAST_VIDEOS_FILTER_USER_NAME + encodeURI(seriesPrefix + ' ' + user.eppn);
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
};

exports.getUserTrashSeries = async (user) => {
    const seriesUrl = constants.OCAST_SERIES_PATH + constants.OCAST_VIDEOS_FILTER_USER_NAME + encodeURI(constants.TRASH + ' ' + user.eppn);
    const response = await security.opencastBase.get(seriesUrl);
    return response.data;
};
/*
exports.getUserSeries = async (user) => {
    const contributorParameters = userService.parseContributor(user.hyGroupCn);
    const seriesUrl =  constants.OCAST_SERIES_PATH + '?filter=contributors:' + user.eppn + ',' + contributorParameters;
    const response = await security.opencastBase.get(seriesUrl);
    // response.data is a list of series
    // HAXXX: split contributors with splitContributorsFromSeriesList
    return splitContributorsFromSeriesList(response.data);
};
 */

/**
 * Returns series for logged in user.
 * These series are the ones user is listed as contributor, the contributor value can be user's username or
 * one of the groups user is a member (grp-something).
 *
 * HAXXX:
 * Opencast is queried once with each contributor value the user has (username and possible groups user is member of).
 * Before returning the series the series contributor values are checked using splitContributorsFromSeries
 * function in ocastMigrationUtils.js
 * @see module:ocastMigrationUtils
 *
 * See LATAAMO-510 for the discussion and details ({@link https://jira.it.helsinki.fi/browse/LATAAMO-510}).
 *
 * Checks feature flag value FEATURE_FLAG_FOR_MIGRATION_ACTIVE
 * If value is not set (undefined) or the value is false the old implementation is used
 * to get the list of user's series.
 *
 *
 * @param user the logged user
 * @returns {Promise<*[]>} List of series were user is listed as a contributor
 */
exports.getUserSeries = async (user) => {
    // check the feature flag value
    if (!isContributorMigrationActive()) {
        const contributorParameters = parseContributor(user.hyGroupCn);
        const seriesUrl =  constants.OCAST_SERIES_PATH + '?filter=contributors:' + user.eppn + ',' + contributorParameters;
        const response = await security.opencastBase.get(seriesUrl);
        return response.data;
    }

    const availableContributorValuesForUser = [user.eppn, ...user.hyGroupCn];
    let returnedSeriesData = [];

    for (let contributorValue of availableContributorValuesForUser) {
        if (contributorValue !== '') {
            let theTruePathToSalvation =
                'series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=' +
                contributorValue + // this is either the user's username or group's name (grp-some_group)
                '&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=0&count=100';
            let seriesUrl = '/series/' + theTruePathToSalvation;
            let response = await security.opencastBase.get(seriesUrl);
            // if totalCount is less or equal result than maximum paging result return all
            if (response.data.totalCount <= 100) {
                // transform data from /series API to same format than the external API (/api/series) uses
                let transformedSeriesList = transformResponseData(response.data.catalogs);
                // remove series that have only partial match in contributor value
                let filteredSeriesList =
                    filterCorrectSeriesWithCorrectContributors(transformedSeriesList, contributorValue);

                returnedSeriesData = returnedSeriesData.concat(filteredSeriesList);
            }
            // if totalCount is more than maximum paging result then loop all pages
            else {
                let pageCount = Math.floor(response.data.totalCount / 100);
                for (let page = 0; page <= pageCount; page++) {
                    let theOtherTruePathToSalvation =
                        'series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=' +
                        contributorValue + // this is either the user's username or group's name (grp-some_group)
                        '&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=' + page + '&count=100';

                    let seriesUrl = '/series/' + theOtherTruePathToSalvation;
                    let response = await security.opencastBase.get(seriesUrl);
                    let transformedSeriesList = transformResponseData(response.data.catalogs);
                    // remove series that have only partial match in contributor value
                    let filteredSeriesList =
                        filterCorrectSeriesWithCorrectContributors(transformedSeriesList, contributorValue);

                    returnedSeriesData = returnedSeriesData.concat(filteredSeriesList);
                }
            }
        }
    }

    // remove possible double series entries using series identifier
    const key = 'identifier';
    const uniqueSeriesList = [...new Map(returnedSeriesData.map(item =>
        [item[key], item])).values()];

    return uniqueSeriesList;
};

exports.getEpisodeForEvent = async (eventId) => {
    const episodeUrl = constants.OCAST_EPISODE_PATH + '?id=' + eventId;
    const response = await security.opencastPresentationBase.get(episodeUrl);
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

exports.getEventAclsFromSeries = async (series) => {
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

exports.getMediaPackageForEvent = async (eventId) => {
    const mediaPackageUrl = constants.OCAST_EVENT_ASSET_EPISODE + eventId;
    const response = await security.opencastBase.get(mediaPackageUrl);
    return response.data;
};

exports.republishWebVttFile = async (eventId) => {
    const republishMetadataUrl = '/workflow/start';
    const mediaPackageUrl = '/assets/episode/' + eventId;
    try{
        let bodyFormData = new FormData();
        // get mediapackage for the republish query
        const response = await security.opencastBase.get(mediaPackageUrl);

        if (response.status !== 200) {
            return {
                status: response.status,
                statusText: response.statusText,
                eventId: eventId
            };
        }
        // form data for the republish request
        bodyFormData = new FormData();
        bodyFormData.append('definition', 'republish-metadata');
        bodyFormData.append('mediapackage', response.data);
        bodyFormData.append('properties', constants.PROPERTIES_REPUBLISH_METADATA);

        let headers = {
            ...bodyFormData.getHeaders(),
            'Content-Length': bodyFormData.getLengthSync()
        };

        let hasActiveTransaction = true;
        let count = 0;
        await new Promise(resolve => setTimeout(resolve, 30000));
        while (hasActiveTransaction && count <= 10){
            const transactionStatusPath = constants.OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + '/hasActiveTransaction';
            let responseX = await security.opencastBase.get(transactionStatusPath);

            if (responseX.data && responseX.data.active !== true) {
                hasActiveTransaction = false;
            }else{
                // transaction active, try again after minute
                count = count + 1;
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }
        await security.opencastBase.post(republishMetadataUrl, bodyFormData, {headers});
    }catch(error){
        logger.error(`error republishing event ${eventId}`);
        throw error;
    }
};

exports.addWebVttFile = async (vttFile, eventId) => {
    const assetsUrl = constants.OCAST_ADMIN_EVENT + eventId + constants.OCAST_ASSETS_PATH;
    let bodyFormData = new FormData();
    bodyFormData.append('attachment_captions_webvtt', vttFile.buffer, {
        filename: vttFile.originalname
    });
    bodyFormData.append('metadata', JSON.stringify(constants.WEBVTT_TEMPLATE));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            'Content-Length': bodyFormData.getLengthSync(),
            'Content-Type': 'multipart/form-data'
        };
        return await security.opencastBase.post(assetsUrl, bodyFormData, {headers});
    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
};

exports.deleteWebVttFile = async (vttFile, eventId) => {
    const assetsUrl = constants.OCAST_ADMIN_EVENT + eventId + constants.OCAST_ASSETS_PATH;
    let bodyFormData = new FormData();
    bodyFormData.append('attachment_captions_webvtt', vttFile, {
        filename: 'empty.vtt'
    });
    bodyFormData.append('metadata', JSON.stringify(constants.WEBVTT_TEMPLATE));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            'Content-Type': 'multipart/form-data'
        };
        return await security.opencastBase.post(assetsUrl, bodyFormData, {headers});
    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
};

exports.getEventAcl = async (event) => {
    const aclUrl = constants.OCAST_VIDEOS_PATH + event.identifier + constants.OCAST_ACL_PATH;
    const response = await security.opencastBase.get(aclUrl);
    return response.data;
};

exports.updateEventAcl = async (event, acl) => {
    const aclUrl = constants.OCAST_VIDEOS_PATH + event.identifier + constants.OCAST_ACL_PATH;
    let bodyFormData = new FormData();
    bodyFormData.append('eventId', event.identifier);
    bodyFormData.append('acl', JSON.stringify(acl));
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            'Content-Type': 'multipart/form-data'
        };
        return await security.opencastBase.put(aclUrl, bodyFormData, {headers});
    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
};

exports.updateEventMetadata = async (metadata, eventId, isTrash, user) => {
    try {
        // check event transaction status
        // http://localhost:8080/admin-ng/event/99f13fe3-2e07-4cbf-bf1e-789e1f0c2a5e/hasActiveTransaction
        const transactionStatusPath = constants.OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + '/hasActiveTransaction';
        const response1 = await security.opencastBase.get(transactionStatusPath);

        if (response1.data && response1.data.active === true) {
            // transaction active, return
            return {
                status: 403,
                statusText: messageKeys.ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DETAILS,
                eventId: eventId
            };
        }
        const videoMetaDataUrl = constants.OCAST_VIDEOS_PATH + eventId + constants.OCAST_METADATA_PATH + constants.OCAST_TYPE_QUERY_PARAMETER + constants.OCAST_TYPE_DUBLINCORE_EPISODE;
        if (isTrash) {
            const trashSeriesUrl = constants.OCAST_SERIES_PATH + constants.OCAST_VIDEOS_FILTER_USER_NAME + encodeURI(constants.TRASH + ' ' + user.eppn);
            const response = await security.opencastBase.get(trashSeriesUrl);
            const trashSeriesList = response.data;

            if (trashSeriesList && trashSeriesList.length > 0) {
                const trashSeries = trashSeriesList[0];
                metadata.isPartOf = trashSeries.identifier;
            }
        }
        const modifiedMetadata = eventsService.modifyEventMetadataForOpencast(metadata);

        // republish paths
        const republishMetadataUrl = '/workflow/start';
        const mediaPackageUrl = '/assets/episode/' + eventId;

        let bodyFormData = new FormData();
        bodyFormData.append('metadata', JSON.stringify(modifiedMetadata));

        let headers = {
            ...bodyFormData.getHeaders(),
            'Content-Length': bodyFormData.getLengthSync()
        };
        // update event metadata
        const response2 = await security.opencastBase.put(videoMetaDataUrl, bodyFormData, {headers});

        // let's break if response from PUT not ok
        if(response2.status !== 204){
            return {
                status: response2.status,
                statusText: response2.statusText,
                eventId: eventId
            };
        }

        // get mediapackage for the republish query
        const response3 = await security.opencastBase.get(mediaPackageUrl);

        if (response3.status !== 200) {
            return {
                status: response3.status,
                statusText: response3.statusText,
                eventId: eventId
            };
        }

        // form data for the republish request
        bodyFormData = new FormData();
        bodyFormData.append('definition', 'republish-metadata');
        bodyFormData.append('mediapackage', response3.data);
        bodyFormData.append('properties', constants.PROPERTIES_REPUBLISH_METADATA);

        headers = {
            ...bodyFormData.getHeaders(),
            'Content-Length': bodyFormData.getLengthSync()
        };

        // do the republish request
        const resp = await security.opencastBase.post(republishMetadataUrl, bodyFormData, {headers});

        return {
            status: resp.status,
            statusText: resp.statusText,
            eventId: eventId
        };
    } catch (error) {
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
            'Content-Length': bodyFormData.getLengthSync()
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
    const videoDescription = '';
    const timeZone = 'Europe/Helsinki';
    const utcDate = zonedTimeToUtc(Date.now(), timeZone);
    const startDate = utcDate.toISOString().split("T")[0];
    const startTime = utcDate.toISOString().split("T")[1];

    const inboxSeriesId = inboxUserSeriesId;  // User's INBOX series id

    // refactor this array to constants.js
    const metadataArray = [
        {
            'flavor': 'dublincore/episode',
            'fields': [
                {
                    'id': 'title',
                    'value': videoFilename
                },
                {
                    'id': 'subjects',
                    'value': []
                },
                {
                    'id': 'description',
                    'value': videoDescription
                },
                {
                    'id': 'startDate',
                    'value': startDate
                },
                {
                    'id': 'startTime',
                    'value': startTime
                },
                {
                    'id': 'isPartOf',
                    'type': 'text',
                    'value': inboxSeriesId
                }
            ]
        }
    ];
    // these are now constant values, maybe should be editable
    const acls = constants.SERIES_ACL_TEMPLATE;
    const acls_tuotanto = constants.SERIES_ACL_TEMPLATE_TUOTANTO;
    const processingMetadata = constants.PROCESSING_METADATA;


    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadataArray));
    if (process.env.ENVIRONMENT === 'prod') {
        bodyFormData.append('acl', JSON.stringify(acls_tuotanto));
    } else {
        bodyFormData.append('acl', JSON.stringify(acls));
    }
    bodyFormData.append('processing', JSON.stringify(processingMetadata));
    // https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options
    bodyFormData.append('presenter', fs.createReadStream(filePathOnDisk));

    try {

        let response = await fetch(process.env.LATAAMO_OPENCAST_HOST + videoUploadUrl, { method: 'POST',
            headers: {'authorization': security.authentication()}
            , body: bodyFormData});


        const data = await response.json();
        const resolvedData = {
            ...data,
            status: response.status,
            data : data
        };
        return resolvedData;

    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
};

exports.downloadVideo = async (videoUrl) => {
    try {
        let response = await fetch(encodeURI(videoUrl), {method: 'GET', headers: {'authorization': security.authentication() }});
        return response;
    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
};

exports.downloadVttFile = async (vttFileUrl) => {
    try {
        let response = await fetch(encodeURI(vttFileUrl), {method: 'GET', headers: {'authorization': security.authentication() }});
        return response;
    } catch (err) {
        return {
            status: 500,
            message: err.message
        };
    }
};

// get or creates series for user with given 'seriesName'
exports.returnOrCreateUsersSeries = async (seriesName, loggedUser) => {
    let lataamoSeriesTitle = seriesTitleForLoggedUser(seriesName, loggedUser.eppn);

    try {
        const userSeries = await this.getUserSeriesWithPrefix(seriesName, loggedUser);
        let series = userSeries.find(series => series.title === lataamoSeriesTitle);

        if (!series) {
            logger.info(seriesName + ` series not found with title ${lataamoSeriesTitle}`);
            series = await this.createLataamoSeries(seriesName, loggedUser.eppn);
            logger.info('Created ' + seriesName + ` ${series}`);
            return series;
        }
        return userSeries;
    }catch(err){
        logger.error(`Error in returnOrCreateUsersSeries USER: ${loggedUser.eppn} ${err}`);
        return false;
    }
};

// create the default lataamo series for the given seriesName + userId
exports.createLataamoSeries = async (seriesName, userId) => {
    const lataamoSeriesTitle = seriesTitleForLoggedUser(seriesName, userId);
    const lataamoSeriesDescription = 'Lataamo-' + seriesName + ` series for ${ userId }`;
    const lataamoSeriesLicense = '';
    const lataamoSeriesLanguage = 'en';
    const lataamoSeriesCreator = 'Lataamo-proxy-service';
    const lataamoSeriesSubject = 'Lataamo-' + seriesName;
    const seriesUrl = constants.OCAST_SERIES_PATH;

    metadataArray = [
        {
            'flavor': 'dublincore/series',
            'title': 'Opencast Series DublinCore',
            'fields': [
                {
                    'readOnly': false,
                    'id': 'title',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.TITLE',
                    'type': 'text',
                    'value': lataamoSeriesTitle,
                    'required': true
                },
                {
                    'readOnly': false,
                    'id': 'subjects',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.SUBJECT',
                    'type': 'text',
                    'value': [
                        lataamoSeriesSubject
                    ],
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'description',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.DESCRIPTION',
                    'type': 'text',
                    'value': lataamoSeriesDescription,
                    'required': false
                },
                {
                    'translatable': true,
                    'readOnly': false,
                    'id': 'language',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.LANGUAGE',
                    'type': 'text',
                    'value': lataamoSeriesLanguage,
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'rightsHolder',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.RIGHTS',
                    'type': 'text',
                    'value': userId,
                    'required': false
                },
                {
                    'translatable': true,
                    'readOnly': false,
                    'id': 'license',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.LICENSE',
                    'type': 'text',
                    'value': lataamoSeriesLicense,
                    'required': false
                },
                {
                    'translatable': false,
                    'readOnly': false,
                    'id': 'creator',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.CREATED_BY',
                    'type': 'mixed_text',
                    'value': [
                        lataamoSeriesCreator, userId
                    ],
                    'required': false
                },
                {
                    'translatable': false,
                    'readOnly': false,
                    'id': 'contributor',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.CONTRIBUTORS',
                    'type': 'mixed_text',
                    'value': [userId],
                    'required': false
                },
                {
                    'translatable': false,
                    'readOnly': false,
                    'id': 'publisher',
                    'label': 'EVENTS.SERIES.DETAILS.METADATA.PUBLISHERS',
                    'type': 'mixed_text',
                    'value': [userId],
                    'required': false
                }
            ]
        }
    ];

    // these are now constant values, maybe should be editable
    const acls = constants.SERIES_ACL_TEMPLATE;
    const acls_tuotanto = constants.SERIES_ACL_TEMPLATE_TUOTANTO;

    let bodyFormData = new FormData();
    bodyFormData.append('metadata', JSON.stringify(metadataArray));
    if (process.env.ENVIRONMENT === 'prod') {
        bodyFormData.append('acl', JSON.stringify(acls_tuotanto));
    } else {
        bodyFormData.append('acl', JSON.stringify(acls));
    }
    try {
        const headers = {
            ...bodyFormData.getHeaders(),
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const response = await security.opencastBase.post(seriesUrl, bodyFormData, {headers});
        return response.data;
    } catch (err) {
        throw err;
    }

};

exports.deleteSeries = async (id) => {
    const url = `${constants.OCAST_SERIES_PATH}${id}`;
    try {
        const response = await security.opencastBase.delete(url);
        return response;
    } catch (error) {
        logger.error(`error while deleting series id: ${id} url: ${url}, error: ${error}`);
        return {
            status: 500,
            message: error.message
        };
    }
};
