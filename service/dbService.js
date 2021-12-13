const dbApi = require("../api/dbApi");
const logger = require("../config/winstonLogger");

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

exports.insertArchivedAndCreationDates = async (eventsWithAcls, loggedUser) => {
    try {
        logger.info(`insert video deletion dates for user :  ${loggedUser.eppn}`);
        let videosFromOpenCast = parseVideosFromOpenCast(eventsWithAcls);
        let videosFromDb = await dbApi.returnVideoIdsFromDb(videosFromOpenCast);
        const newVideos = filterOnlyNewVideos(videosFromOpenCast, videosFromDb);

        if (newVideos && newVideos.length > 0) {
            for (const video of newVideos) {
                logger.info(`insert deletion date for video id : ${video.id}`);
                console.log("HIT", video.id);
                await dbApi.insertArchiveAndVideoCreationDates(video);
            }
        }
    } catch (error) {
        logger.error(`error inserting deletion dates for user ${loggedUser.eppn}`);
        throw error;
    }
};
