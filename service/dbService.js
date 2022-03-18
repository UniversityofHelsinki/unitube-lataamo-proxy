const dbApi = require('../api/dbApi');
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');

const parseVideosFromOpenCast = (inboxEventsWithAcls) => {
    let inboxIds = [];
    for (const inboxEventWithAcl of inboxEventsWithAcls) {
        inboxIds.push({ id : inboxEventWithAcl.identifier , created : inboxEventWithAcl.created });
    }
    return inboxIds;
};

const filterOnlyNewVideos = (videoIdsFromOpenCast, videosFromDb) => {
    let videoIdsFromDb = [];

    if (videosFromDb.rows && videosFromDb.rowCount > 0) {
        for (const row of videosFromDb.rows) {
            videoIdsFromDb.push(row.video_id);
        }
        return videoIdsFromOpenCast.filter(x => !videoIdsFromDb.includes(x.id));
    } else {
        return videoIdsFromOpenCast;
    }
};

const isVideoReturnedToActiveState = async(videosFromDb) => {
    if (videosFromDb && videosFromDb.rowCount > 0) {
        const now = new Date();
        const activeStateVideos = videosFromDb.rows.filter(x => x.actual_archived_date && x.actual_archived_date < now);
        return activeStateVideos;
    } else {
        return [];
    }
};


exports.insertArchivedAndCreationDates = async (eventsWithAcls, loggedUser) => {
    try {
        logger.info(`insert video deletion dates for user :  ${loggedUser.eppn}`);
        let videosFromOpenCast = parseVideosFromOpenCast(eventsWithAcls);
        let videosFromDb = await dbApi.returnVideoIdsFromDb(videosFromOpenCast);
        const newVideos = filterOnlyNewVideos(videosFromOpenCast, videosFromDb);
        if (newVideos && newVideos.length > 0) {
            for (const video of newVideos) {
                logger.info(`insert deletion date for video id : ${video.id}`);
                await dbApi.insertArchiveAndVideoCreationDates(video);
            }
        }
        const activeStateVideos = await isVideoReturnedToActiveState(videosFromDb);
        if (activeStateVideos && activeStateVideos.length > 0) {
            for (const video of activeStateVideos) {
                logger.info(`update state to active for video id : ${video.video_id}`);
                await dbApi.updateVideoToActiveState(video);
            }
        }
    } catch (error) {
        logger.error(`error inserting deletion dates for user ${loggedUser.eppn}`);
        throw error;
    }
};

exports.insertOrUpdateVideoArchivedDate = async (videoId, loggedUser) => {
    try {
        logger.info(`insert or update video ${videoId} deletion date for user : ${loggedUser.eppn}`);
        let videoFromDb = await dbApi.returnVideoIdFromDb(videoId);

        if (videoFromDb && videoFromDb.rowCount > 0) {
            logger.info(`update deletion date for video id : ${videoId} marked for deletion`);
            await dbApi.updateVideoArchivedDateMarkedForDeletion(videoId);
        } else {
            logger.info(`insert deletion date for video id : ${videoId} marked for deletion`);
            await dbApi.insertVideoArchivedDateMarkedForDeletion(videoId);
        }
    } catch (error) {
        logger.error(`error inserting deletion dates for user ${loggedUser.eppn}`);
        throw error;
    }
};

exports.updateVideoToActiveState = async (videoId, loggedUser) => {
    try {
        logger.info(`update video ${videoId} to active state for user : ${loggedUser.eppn}`);
        let videoFromDb = await dbApi.returnVideoIdFromDb(videoId);

        if (videoFromDb && videoFromDb.rowCount > 0) {
            const video = {video_id : videoId};
            await dbApi.updateVideoToActiveState(video);
        } else {
            logger.error(`error updating video ${videoId} to active state for user ${loggedUser.eppn} video not found in db`);
        }
    } catch (error) {
        logger.error(`error updating video ${videoId} to active state for user ${loggedUser.eppn} ${error}`);
        throw error;
    }
};

exports.getArchivedDate = async (videoId) => {
    try{
        logger.info(`get video ${videoId} deletion date`);
        let videoDeletionDateFromDb = await dbApi.returnArchivedDateFromDb(videoId);
        if(videoDeletionDateFromDb && videoDeletionDateFromDb.rowCount > 0) {
            videoDeletionDateFromDb = videoDeletionDateFromDb.rows[0].archived_date;
            return videoDeletionDateFromDb;
        }else {
            logger.info(`Cannot get deletion date for video id : ${videoId}`);
            return null;
        }
    } catch (error) {
        logger.error(`error getting deletion date for video ${videoId}`);
        throw error;
    }
};

exports.updateArchivedDate = async (videoId, deletionDate, loggedUser) => {
    try {
        logger.info(`update video ${videoId} deletion date for user : ${loggedUser.eppn}`);
        let videoFromDb = await dbApi.returnVideoIdFromDb(videoId);

        if (videoFromDb && videoFromDb.rowCount > 0) {
            const response = await dbApi.updateVideoArchivedDate(videoId, deletionDate);
            if(response && response.rowCount > 0) {
                return {
                    status: 200,
                    statusText: messageKeys.SUCCESS_MESSAGE_TO_UPDATE_EVENT_DELETION_DATE,
                };
            }else{
                return {
                    status: 500,
                    statusText: messageKeys.ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DELETION_DATE,
                };
            }
        }else{
            return {
                status: 404,
                statusText: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_FOR_UPDATE_DELETION_DATE,
            };
        }
    } catch (error) {
        logger.error(`error updating deletion date for video ${videoId}`);
        throw error;
    }
};
