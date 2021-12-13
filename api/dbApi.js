const database = require("../service/database");
const logger = require("../config/winstonLogger");
const fs = require("fs");
const path = require("path");
const Constants = require("../utils/constants");

exports.returnVideoIdsFromDb = async (videos) => {
    try {
        let videoIdsFromOpenCast = videos.map(item => item['id']);
        const selectVideos =  fs.readFileSync(path.resolve(__dirname, "../sql/selectVideos.sql"), "utf8");
        return await database.query(selectVideos, [videoIdsFromOpenCast]);
    } catch (err) {
        logger.error(`Error returning video id:s ${err} ${err.message}`);
        throw err;
    }
};

const getArchivedDate = () => {
    let archivedDate = new Date();
    archivedDate.setFullYear(archivedDate.getFullYear() + Constants.DEFAULT_VIDEO_ARCHIVED_YEAR_AMOUNT);
    return archivedDate;
};

exports.insertArchiveAndVideoCreationDates = async (video) => {
    try {
        let archivedDate = getArchivedDate();
        const insertArchivedAndCreationDatesSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/insertArchivedAndVideoCreationDates.sql"), "utf8");
        await database.query(insertArchivedAndCreationDatesSQL, [video.id, archivedDate, video.created]);
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${video.id} ${err} ${err.message}`);
        throw err;
    }
};
