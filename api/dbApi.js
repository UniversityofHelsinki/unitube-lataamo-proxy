const database = require("../service/database");
const logger = require("../config/winstonLogger");
const fs = require("fs");
const path = require("path");

exports.returnVideoIdsFromDb = async (ids) => {
    try {
        const selectVideos =  fs.readFileSync(path.resolve(__dirname, "../sql/selectVideos.sql"), "utf8");
        return await database.pool.query(selectVideos, [ids]);
    } catch (err) {
        logger.error(`Error returning video id:s ${err} ${err.message}`);
    }
};

const addThreeYears = () => {
    let deletionDate = new Date();
    deletionDate.setFullYear(deletionDate.getFullYear() + 3);
    return deletionDate;
};

exports.insertDeletionDates = async (id) => {
    try {
        let deletionDate = addThreeYears();
        const insertDeletionDateSQL =  fs.readFileSync(path.resolve(__dirname, "../sql/insertDeletionDate.sql"), "utf8");
        await database.pool.query(insertDeletionDateSQL, [id, deletionDate]);
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${id} ${err} ${err.message}`);
    }
};
