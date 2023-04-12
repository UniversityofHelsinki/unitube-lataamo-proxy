const equal = require('deep-equal');
const commonService = require('./commonService');
const seriesService = require('./seriesService');
const apiService = require('./apiService');
const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
momentDurationFormatSetup(moment);
const constants = require('../utils/constants');
//const {inboxSeriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions
const logger = require('../config/winstonLogger');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const JsonFind = require('json-find');
const messageKeys = require('../utils/message-keys');
const pLimit = require('p-limit');
// Limit number of request fetched concurrently
const limit = pLimit(5);

const _mapPublications = (videoList, publications) => {
    const media = publications.map(p => p.media).flatMap(m => m);
    const result = {};
    videoList.forEach(url => {
        if (media.map(m => m.url).indexOf(url) >= 0) {
            result[url] = media[media.map(m => m.url).indexOf(url)];
        }
    });
    return result;
};


exports.filterEventsForClientList = (ocResponseData, loggedUser) => {

    try {
        if (!ocResponseData || !Array.isArray(ocResponseData)) {
            return [];
        }

        const eventArray = [];


        ocResponseData.forEach(event => {
            eventArray.push({
                'identifier': event.identifier,
                'title': event.title,
                'description': event.description,
                'license': event.license,
                'duration': calculateMediaDurationForVideoList(event, loggedUser),
                'creator': event.creator,
                'processing_state': event.processing_state,
                'visibility': calculateVisibilityPropertyForVideoList(event, loggedUser),
                'created': event.created,
                'series': event.series,
                'media': calculateMediaPropertyForVideoList(event, loggedUser),
                'publications': _mapPublications(calculateMediaPropertyForVideoList(event, loggedUser), event.publications),
                'archived_date': event.archived_date
            });
        });
        return eventArray;
    } catch (error) {
        logger.error(`error filtering events for client ${error} ${error.message} USER ${loggedUser}`);
    }
};



exports.filterEventsForClientTrash = (ocResponseData, loggedUser) => {

    if(!ocResponseData){
        return [];
    }

    const eventArray = [];
    ocResponseData.forEach(event => {
        if(event.processing_state!=='FAILED'){
            eventArray.push({
                'identifier': event.identifier,
                'title': event.title,
                'description' : event.description,
                'license' : event.license,
                'duration': calculateMediaDurationForVideoList(event, loggedUser),
                'creator': event.creator,
                'processing_state' : event.processing_state,
                'visibility' : calculateVisibilityPropertyForVideoList(event, loggedUser),
                'created': event.created,
                'series': event.series,
                'media' : calculateMediaPropertyForVideoList(event, loggedUser),
                'publications': _mapPublications(calculateMediaPropertyForVideoList(event, loggedUser), event.publications)
            });
        }
    });
    return eventArray;
};

const calculateMediaDurationForVideoList = (event, loggedUser) => {
    try {
        let duration = '00:00:00';
        if (event.publications) {
            let apiChannel = event.publications.find(publication => publication.channel === 'api');

            if (apiChannel && apiChannel.media) {
                apiChannel.media.forEach(media => {
                    if (media.has_video) {
                        duration = moment.duration(media.duration, 'milliseconds').format('HH:mm:ss', {trim: false});
                    }
                });
            }
        } else {
            logger.warn(`publications missing in media duration ${event.identifier} FOR USER ${loggedUser.eppn}`);
        }
        return duration;
    } catch (error) {
        logger.error(`error calculating media duration for video list ${error} ${error.message} ${event.identifier} FOR USER ${loggedUser.eppn}`);
    }
};

const calculateMediaPropertyForVideoList = (event, loggedUser) => {
    try {
        let mediaUrls = [];
        if (event.publications) {
            event.publications.forEach(publication => {
                if (publication.media) {
                    publication.media.forEach(media => {
                        if (media.has_video && event.processing_state === constants.OPENCAST_STATE_SUCCEEDED) {
                            mediaUrls.push(media.url);
                        }
                    });
                }
            });
        } else {
            logger.warn(`publications missing in media property ${event.identifier} FOR USER ${loggedUser.eppn}`);
        }
        return [...new Set(mediaUrls)];
    } catch (error) {
        logger.error(`error calculating media property for video list  ${error}  ${error.message} ${event.identifier} FOR USER ${loggedUser.eppn}`);
    }
};

exports.calculateVisibilityProperty = (event) => {
    return {
        ...event,
        visibility: calculateVisibilityPropertyForVideo(event)
    };
};

const calculateVisibilityPropertyForVideoList = (video, loggedUser) => {
    try {
        const visibility = [];

        let moodleAclInstructor;
        let moodleAclLearner;

        if (video.acl.map(acl => acl.role).includes(constants.ROLE_USER_UNLISTED)) {
            visibility.push(constants.STATUS_UNLISTED);
        } else if (commonService.publicRoleCount(video.acl) >= 1) { //video has both (constants.ROLE_ANONYMOUS, constants.ROLE_KATSOMO) roles
            visibility.push(constants.STATUS_PUBLISHED);
        } else {
            visibility.push(constants.STATUS_PRIVATE);
        }

        if (video && video.acl) {
            moodleAclInstructor = video.acl.filter(acl => acl.role.includes(constants.MOODLE_ACL_INSTRUCTOR));
            moodleAclLearner = video.acl.filter(acl => acl.role.includes(constants.MOODLE_ACL_LEARNER));
        } else {
            console.log("calculating visibility property for video in list , warning video has no acl roles" , JSON.stringify(video));
            logger.warn(`warning video has no acl roles ${video.identifier} FOR USER ${loggedUser.eppn}`);
        }

        if (moodleAclInstructor && moodleAclLearner && moodleAclInstructor.length > 0 && moodleAclLearner.length > 0) {
            visibility.push(constants.STATUS_MOODLE);
        }

        return [...new Set(visibility)];
    } catch (error) {
        logger.error(`error calculating visibility property for video list  ${error}  ${error.message} ${video.identifier} FOR USER ${loggedUser.eppn}`);
    }
};

const calculateVisibilityPropertyForVideo = (video, loggedUser) => {
    try {
        const visibility = [];

        let moodleAclInstructor;
        let moodleAclLearner;

        if (video.acls.map(r => r.role).includes(constants.ROLE_USER_UNLISTED)) {
            visibility.push(constants.STATUS_UNLISTED);
        } else if (commonService.publicRoleCount(video.acls) >= 1) { //video has both (constants.ROLE_ANONYMOUS, constants.ROLE_KATSOMO) roles
            visibility.push(constants.STATUS_PUBLISHED);
        } else {
            visibility.push(constants.STATUS_PRIVATE);
        }

        if (video && video.acls) {
            moodleAclInstructor = video.acls.filter(acl => acl.role.includes(constants.MOODLE_ACL_INSTRUCTOR));
            moodleAclLearner = video.acls.filter(acl => acl.role.includes(constants.MOODLE_ACL_LEARNER));
        } else {
            console.log("calculating visibility property for video in list , warning video has no acl roles" , JSON.stringify(video));
            logger.warn(`warning video has no acl roles : ${video.identifier} FOR USER ${loggedUser.eppn}`);
        }

        if (moodleAclInstructor && moodleAclLearner && moodleAclInstructor.length > 0 && moodleAclLearner.length > 0) {
            visibility.push(constants.STATUS_MOODLE);
        }

        return [...new Set(visibility)];
    } catch (error) {
        logger.error(`error calculating visibility property for video ${error} ${error.message} ${video.identifier} FOR USER ${loggedUser.eppn}`);
    }
};

const filterUniqueSeriesIdentifiers = (seriesIdentifiers) => [... new Set(seriesIdentifiers)];

exports.getAllEvents = async (seriesIdentifiers) => {
    return await Promise.all(seriesIdentifiers.map(identifier => apiService.getEventsByIdentifier(identifier)));
};

exports.getAllSerieEvents = async (seriesIdentifier) => {
    return await apiService.getEventsByIdentifier(seriesIdentifier);
};

exports.getAllEventsBySeriesIdentifiers = async (seriesIdentifiers) => {
    try {
        const filteredUniqueSeriesIdentifiers = filterUniqueSeriesIdentifiers(seriesIdentifiers);

        const promises = filteredUniqueSeriesIdentifiers.map(identifier => limit(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(apiService.getEventsBySeriesIdentifier(identifier));
                }, 500);
            });
        }));

        return Promise.all(promises);
    } catch (err) {
        throw new Error('An error occurred' + err);
    }
};

exports.getAllEventsBySeriesIdentifier = async (seriesIdentifier) => {
    return await apiService.getEventsBySeriesIdentifier(seriesIdentifier);
};

const getAllEventsWithSeries = async (series) => await Promise.all(series.map(series => apiService.getEventsWithSeriesByIdentifier(series)));

exports.getAllSeriesEventsCount = async (series) => await getAllEventsWithSeries(series);

exports.getAllEventsCountForSeries = async (series) => await apiService.getEventsWithSeriesByIdentifier(series);

exports.getAllEventsWithMetadatas = async (events) => {
    return Promise.all(events.map(async event => {
        const metadata = await apiService.getMetadataForEvent(event);
        return {
            ...event,
            metadata: metadata
        };
    }));
};

exports.getEventsWithMedia = async (events) => {
    return Promise.all(events.map(async event => {
        const media = await apiService.getMediaForEvent(event);
        return {
            ...event,
            media: media
        };
    }));
};

exports.getAllEventsWithMediaFileMetadata = async (events) => {
    return Promise.all(events.map(async event => {
        let mediaId =  event.media[0].id;
        const mediaFileMetadata = await apiService.getMediaFileMetadataForEvent(event.identifier, mediaId);
        return {
            ...event,
            mediaFileMetadata : mediaFileMetadata
        };
    }));
};

const getVttWithTrack = async (vttFile) => {
    const vttFileTrack = await apiService.downloadVttFile(vttFile.url);
    const text = await vttFileTrack.text();
    return text;
};

exports.getVttFile = async (episode, mediaUrls) => {
    const json = JsonFind(episode);

    const mediaPackage = json.checkKey('mediapackage');

    if (mediaPackage && Object.keys(mediaPackage).length > 0) {
        return mediaUrls.map(mediaUrl => {
            if (mediaPackage.id === mediaUrl.id) {
                const attachments = json.checkKey('attachment');
                const foundVttFile = attachments.find(field => {
                    return field.mimetype === 'text/vtt';
                });
                return foundVttFile.url;
            }
        })[0];
    }
};

exports.getVttWithMediaUrls = async (episode, mediaUrls) => {

    const json = JsonFind(episode);

    const mediaPackage = json.checkKey('mediapackage');

    if (mediaPackage && Object.keys(mediaPackage).length > 0) {
        return Promise.all(mediaUrls.map(async mediaUrl => {
            if (mediaPackage.id === mediaUrl.id) {
                const attachemets =  json.checkKey('attachment');
                const foundVttFile = attachemets.find(field => {
                    return field.mimetype === 'text/vtt';
                });
                mediaUrl.vttFile = foundVttFile ? foundVttFile : '';
                if (mediaUrl.vttFile) {
                    const vttTrack = await getVttWithTrack(mediaUrl.vttFile);
                    mediaUrl.vttFile.track = vttTrack;
                }
            }
            return mediaUrl;
        }));
    }
};

exports.getAllEventsWithAcls = async (events) => {
    return Promise.all(events.map(async event => {
        let metadata = event.metadata;
        let seriesField = seriesService.getSeriesFromEventMetadata(metadata);
        let acls = await apiService.getEventAclsFromSeries(seriesField.value);
        let series = await apiService.getSeries(seriesField.value);
        return {
            ...event,
            acls : acls,
            series : series
        };
    }));
};

exports.getLicenseFromEventMetadata = (event) => {
    const foundEpisodeFlavorMetadata = event.metadata.find(field => {
        return field.flavor === 'dublincore/episode';
    });
    const foundFieldWithLicenseInfo = foundEpisodeFlavorMetadata.fields.find(field => {
        return field.id === 'license';
    });
    return {
        ...event,
        license : foundFieldWithLicenseInfo ? foundFieldWithLicenseInfo.value : ''
    };
};

exports.getEventWithSeries = async (event) => {
    const metadata = await apiService.getMetadataForEvent(event);
    const seriesMetadata = seriesService.getSeriesFromEventMetadata(metadata);
    const series = await apiService.getSeries(seriesMetadata.value);
    return {
        ...event,
        isPartOf : seriesMetadata.value,
        series: series
    };
};

exports.getEventAclsFromSeries = async (eventWithSerie) => {
    const eventAcls = await apiService.getEventAclsFromSeries(eventWithSerie.isPartOf);
    return {
        ...eventWithSerie,
        acls : eventAcls
    };
};

exports.getMetadataForEvent = async (event) => {
    const metadata = await apiService.getMetadataForEvent(event);
    return {
        ...event,
        metadata: metadata
    };
};

exports.getMediaForEvent = async (event) => {
    const media = await apiService.getMediaForEvent(event);
    return {
        ...event,
        media: media
    };
};

exports.getMediaFileMetadataForEvent = async (event) => {
    let mediaId =  event.media[0].id;
    const mediaFileMetaData = await apiService.getMediaFileMetadataForEvent(event.identifier, mediaId);
    return {
        ...event,
        mediaFileMetadata : mediaFileMetaData
    };
};

exports.updateEventAcl = async (events, acl, series) => {
    return Promise.all(events.map(async event => {
        const eventAcl = await apiService.getEventAcl(event);
        if (!equal(eventAcl, acl)) {
            logger.info(`EVENT : ${event.identifier} ACL : ${JSON.stringify(eventAcl)} IS NOT SAME AS SERIES : ${series} ACL : ${JSON.stringify(acl)}`);
            await apiService.updateEventAcl(event, acl);
        }
        return {
            ...event,
            acl: acl
        };
    }));
};

exports.getDurationFromMediaFileMetadataForEvent = (event) => {
    return {
        ...event,
        duration: moment.duration(event.mediaFileMetadata.duration, 'milliseconds').format('HH:mm:ss', {trim:false})
    };
};

exports.modifyEventMetadataForOpencast = (metadata) => {
    const metadataArray = [];

    metadataArray.push(
        {
            'id' : 'title',
            'value': metadata.title
        },
        {
            'id' : 'description',
            'value': metadata.description
        }, {
            'id' : 'isPartOf',
            'value' : metadata.isPartOf
        }, {
            'id': 'license',
            'value': metadata.license
        });

    return metadataArray;
};

exports.modifySeriesEventMetadataForOpencast = (metadata) => {
    const metadataArray = [];

    metadataArray.push({
        'id' : 'title',
        'value': metadata.title },
    {
        'id' : 'description',
        'value': metadata.description
    },
    {
        'id' : 'contributor',
        'value': metadata.contributors
    }
    );

    return metadataArray;
};

exports.concatenateArray = (data) => Array.prototype.concat.apply([], data);

/* Not in use
exports.inboxSeriesHandling = async (req, res, loggedUser, filePathOnDisk) => {
    try {
        let inboxSeries = await returnOrCreateUsersInboxSeries(loggedUser);
        if (!inboxSeries || !inboxSeries.identifier) {
            // on failure clean file from disk and return 500
            deleteFile(filePathOnDisk);
            res.status(500);
            const msg = `${filename} failed to resolve inboxSeries for user`;
            logger.error(`POST /userVideos ${msg} USER: ${req.user.eppn}`);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                msg
            });
        }
        return inboxSeries;
    } catch (err) {
        // Log error and throw reason
        console.log(err);
        throw 'Failed to resolve user\'s inbox series';
    }
};
*/

exports.uploadToOpenCast = async (req, res, inboxSeries, filePathOnDisk, filename, timeDiff) => {
    try {
        const response = await apiService.uploadVideo(filePathOnDisk, filename, inboxSeries.identifier);

        if (response && response.status === 201) {
            // on success clean file from disk and return 200
            deleteFile(filePathOnDisk);
            res.status(200);
            logger.info(`${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. 
                                    Opencast event ID: ${JSON.stringify(response.data)} USER: ${req.user.eppn}`);
            res.json({ message: `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. 
                                    Opencast event ID: ${JSON.stringify(response.data)}`});
        } else {
            // on failure clean file from disk and return 500
            deleteFile(filePathOnDisk);
            res.status(500);
            const msg = `${ filename } failed.`;
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                msg
            });
        }
    } catch (err) {
        // Log error and throw reason
        console.log(err);
        throw 'Failed to upload video to opencast';
    }
};

// clean after post
const deleteFile = (filename) => {
    fs.unlink(filename, (err) => {
        if (err) {
            logger.error(`Failed to remove ${filename} | ${err}`);
        } else {
            logger.info(`Removed ${filename}`);
        }
    });
};

exports.getEventViews = async (id, eventWithLicenseOptions) => {
    const eventViews = await apiService.getEventViews(id);
    return {
        ...eventWithLicenseOptions,
        views: eventViews.stats.views
    };
};

/* Not in use
const returnOrCreateUsersInboxSeries = async (loggedUser) => {
    const lataamoInboxSeriesTitle = inboxSeriesTitleForLoggedUser(loggedUser.eppn);

    try {
        const userSeries = await apiService.getUserSeries(loggedUser);
        let inboxSeries = userSeries.find(series => series.title === lataamoInboxSeriesTitle);

        if (!inboxSeries) {
            logger.info(`inbox series not found with title ${lataamoInboxSeriesTitle}`);
            inboxSeries = await apiService.createLataamoInboxSeries(loggedUser.eppn);
            logger.info(`Created inbox ${inboxSeries}`);
        }
        return inboxSeries;
    }catch(err){
        logger.error(`Error in returnOrCreateUsersInboxSeries ${err}`);
        throw err;
    }
};*/
