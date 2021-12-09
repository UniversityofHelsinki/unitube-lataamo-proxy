const dbApi = require("../api/dbApi");

const getVideoIds = (inboxEventsWithAcls) => {
    let inboxIds = [];
    for (const inboxEventWithAcl of inboxEventsWithAcls) {
        inboxIds.push(inboxEventWithAcl.identifier);
    }
    return inboxIds;
};

const filterOnlyNewVideoIds = (videoIds, foundVideos) => {
    let foundVideoIdArray = [];

    if (foundVideos.rows && foundVideos.rowCount > 0) {
        for (const row of foundVideos.rows) {
            foundVideoIdArray.push(row.video_id);
        }
        return videoIds.filter(id => !foundVideoIdArray.includes(id));
    } else {
        return videoIds;
    }
};

exports.insertDeletionDates = async (inboxEventsWithAcls) => {
    let videoIds = getVideoIds(inboxEventsWithAcls);
    let foundVideos = await dbApi.returnVideoIdsFromDb(videoIds);

    let newVideoIds = filterOnlyNewVideoIds(videoIds, foundVideos);

    if (newVideoIds && newVideoIds.length > 0) {
        for (const videoId of newVideoIds) {
            await dbApi.insertDeletionDates(videoId);
        }
    }
};
