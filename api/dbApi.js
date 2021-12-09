const database = require("../service/database");
const logger = require("../config/winstonLogger");

exports.returnVideoIdsFromDb = async (ids) => {
    try {
        return await database.pool.query("SELECT video_id FROM videos WHERE video_id = ANY ($1)", [ids]);
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
        await database.pool.query("INSERT INTO videos (video_id, deletion_date) VALUES($1, $2) RETURNING *",
            [id, deletionDate]
        );
    } catch (err) {
        logger.error(`Error inserting deletion date for videoId : ${id} ${err} ${err.message}`);
    }
};
