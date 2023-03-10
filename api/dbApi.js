const database = require("../service/database");
const logger = require("../config/winstonLogger");
const fs = require("fs");
const path = require("path");
const Constants = require("../utils/constants");
const {options} = require('pg/lib/defaults');


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
        let archivedDate = getArchivedDate();
        const insertArchivedAndCreationDatesSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/insertArchivedAndVideoCreationDates.sql"), "utf8");
        await database.query(insertArchivedAndCreationDatesSQL, [video.id, archivedDate, video.created]);
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${video.id} ${err} ${err.message}`);
        throw err;
    }
};

exports.insertArchiveAndVideoCreationDatesForVideoUpload = async (video) => {
    try {
        const insertArchivedAndCreationDatesSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/insertArchivedAndVideoCreationDates.sql"), "utf8");
        await database.query(insertArchivedAndCreationDatesSQL, [video.identifier, video.archivedDate, video.created]);
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${video.identifier} ${err} ${err.message}`);
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

exports.updateVideoToActiveState = async(video) => {
    try {
        let archivedDate = getArchivedDate();
        const updateVideoToActiveStateSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/updateVideoToActiveState.sql"), "utf8");
        await database.query(updateVideoToActiveStateSQL, [archivedDate, null, video.video_id]);
    } catch (err) {
        logger.error(`Error updating video to active state : ${video.video_id} ${err} ${err.message}`);
        throw err;
    }
};

exports.updateVideoArchivedDate = async (videoId, deletionDate) => {
    try {
        let archivedDate = new Date(deletionDate.deletionDate);
        const updateVideoArchivedDateSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/updateVideoArchivedDate.sql"), "utf8");
        return await database.query(updateVideoArchivedDateSQL, [archivedDate, videoId]);
    } catch (err) {
        logger.error(`Error updating deletion date for videoId : ${videoId} ${err} ${err.message}`);
        throw err;
    }
};

exports.updateSkipEmailStatus = async (video, skipEmailStatus) => {
    try {
        const updateSkipEmailStatusSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/updateSkipEmailStatus.sql"), "utf8");
        return await database.query(updateSkipEmailStatusSQL, [skipEmailStatus, video.video_id]);
    } catch (err) {
        logger.error(`Error updating skip email status ${skipEmailStatus} for videoId : ${video.video_id} ${err} ${err.message}`);
        throw err;
    }
};

exports.clearNotificationSentAt = async (video) => {
    try {
        const updateNotificationSentSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/updateNotificationSent.sql"), "utf8");
        return await database.query(updateNotificationSentSQL, [null, null, null, video.video_id]);
    } catch (err) {
        logger.error(`Error clearing notification sent status for videoId : ${video.video_id} ${err} ${err.message}`);
        throw err;
    }
};