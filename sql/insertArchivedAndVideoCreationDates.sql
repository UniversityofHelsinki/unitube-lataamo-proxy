INSERT INTO videos (video_id, archived_date, video_creation_date) VALUES($1, $2, $3) RETURNING *
