const database = require("../service/database");

exports.insertRemovalDates =  async (ids) => {
    let difference = [];
    let foundVideoIdArray = [];

    try {
        let foundVideoIds = await database.pool.query("SELECT video_id FROM videos WHERE video_id = ANY ($1)", [ids]);
        if (foundVideoIds.rows && foundVideoIds.rowCount > 0) {
            for (const row of foundVideoIds.rows) {
                foundVideoIdArray.push(row.video_id);
            }
            difference = ids.filter(x => !foundVideoIdArray.includes(x));
        } else {
            difference = ids;
        }
        console.log(difference);
        if (difference && difference.length > 0) {
            for (const intersectionElement of difference) {
                let deletionDate = new Date();
                deletionDate.setFullYear(deletionDate.getFullYear() + 3);
                await database.pool.query("INSERT INTO videos (video_id, deletion_date) VALUES($1, $2) RETURNING *",
                    [intersectionElement, deletionDate]
                );
            }
        }
    }  catch (err) {
        console.error(err.message);
    }
};
