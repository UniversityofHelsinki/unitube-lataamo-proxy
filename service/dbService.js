const dbApi = require('../api/dbApi');
const logger = require('../config/winstonLogger');

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
