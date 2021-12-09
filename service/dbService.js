const dbApi = require("../api/dbApi");
const logger = require("../config/winstonLogger");

const parseVideoIdsFromOpenCast = (inboxEventsWithAcls) => {
    let inboxIds = [];
    for (const inboxEventWithAcl of inboxEventsWithAcls) {
        inboxIds.push(inboxEventWithAcl.identifier);
    }
    return inboxIds;
};

const filterOnlyNewVideoIds = (videoIdsFromOpenCast, videosFromDb) => {
    let videoIdsFromDb = [];

    if (videosFromDb.rows && videosFromDb.rowCount > 0) {
        for (const row of videosFromDb.rows) {
            videoIdsFromDb.push(row.video_id);
        }
        return videoIdsFromOpenCast.filter(id => !videoIdsFromDb.includes(id));
    } else {
        return videoIdsFromOpenCast;
    }
};

exports.insertDeletionDates = async (inboxEventsWithAcls, loggedUser) => {
    logger.info(`insert video deletion dates for user :  ${loggedUser}`);
    let videoIdsFromOpenCast = parseVideoIdsFromOpenCast(inboxEventsWithAcls);
    let videosFromDb = await dbApi.returnVideoIdsFromDb(videoIdsFromOpenCast);

    let newVideoIds = filterOnlyNewVideoIds(videoIdsFromOpenCast, videosFromDb);

    if (newVideoIds && newVideoIds.length > 0) {
        for (const videoId of newVideoIds) {
            logger.info(`insert deletion date for video id : ${videoId}`);
            await dbApi.insertDeletionDates(videoId);
        }
    }
};
