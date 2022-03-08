SELECT video_id, actual_archived_date FROM videos WHERE video_id = ANY ($1)
