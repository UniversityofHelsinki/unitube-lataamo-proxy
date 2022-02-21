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

const setArchivedDate = () => {
    let archivedDate = new Date();
    archivedDate.setFullYear(archivedDate.getFullYear() + Constants.DEFAULT_VIDEO_ARCHIVED_YEAR_AMOUNT);
    return archivedDate;
};

const getArchivedDateForVideoMarkedForDeletion = () => {
    let archivedDateForVideoMarkedForDeletion = new Date();
    archivedDateForVideoMarkedForDeletion.setMonth(archivedDateForVideoMarkedForDeletion.getMonth() + Constants.DEFAULT_VIDEO_MARKED_FOR_DELETION_MONTHS_AMOUNT);
    return archivedDateForVideoMarkedForDeletion;
};

exports.returnArchivedDateFromDb = async (videoId) => {
    try{
        const selectArchivedDateSQL = fs.readFileSync(path.resolve(__dirname, "../sql/selectVideoArchivedDate.sql"), "utf8");
        return await database.query(selectArchivedDateSQL, [videoId]);
    }catch (err) {
        logger.error(`Error returning video deletion date ${err} ${err.message}`);
        throw err;
    }
};

exports.insertArchiveAndVideoCreationDates = async (video) => {
    try {
        let archivedDate = setArchivedDate();
        const insertArchivedAndCreationDatesSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/insertArchivedAndVideoCreationDates.sql"), "utf8");
        await database.query(insertArchivedAndCreationDatesSQL, [video.id, archivedDate, video.created]);
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${video.id} ${err} ${err.message}`);
        throw err;
    }
};

exports.returnVideoIdFromDb = async (id) => {
    try {
        const selectVideos =  fs.readFileSync(path.resolve(__dirname, "../sql/selectVideo.sql"), "utf8");
        return await database.query(selectVideos, [id]);
    } catch (err) {
        logger.error(`Error returning video id:s ${err} ${err.message}`);
        throw err;
    }
};

exports.updateVideoArchivedDateMarkedForDeletion = async (videoId) => {
    try {
        let archivedDate = getArchivedDateForVideoMarkedForDeletion();
        const updateVideoArchivedDateSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/updateVideoArchivedDate.sql"), "utf8");
        await database.query(updateVideoArchivedDateSQL, [archivedDate, videoId]);
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${videoId} ${err} ${err.message}`);
        throw err;
    }
};

exports.insertVideoArchivedDateMarkedForDeletion = async (videoId) => {
    try {
        let archivedDate = getArchivedDateForVideoMarkedForDeletion();
        const updateVideoArchivedDateSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/insertVideoArchivedDate.sql"), "utf8");
        await database.query(updateVideoArchivedDateSQL, [videoId, archivedDate, new Date()]);
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${videoId} ${err} ${err.message}`);
        throw err;
    }
};
