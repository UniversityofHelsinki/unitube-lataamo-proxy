const releaseNotesService = require('../service/releaseNotesService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
exports.getReleaseNotes = async (req, res) => {
    try {
        const releaseNotes = await releaseNotesService.getReleaseNotes();
        res.json(releaseNotes);
    } catch (error) {
        const msg = error.message;
        logger.error(`error when trying to get release notes ${error.message}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_RELEASE_NOTES,
            msg
        });
    }
};

