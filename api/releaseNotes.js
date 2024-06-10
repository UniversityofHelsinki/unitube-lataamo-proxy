const releaseNotesService = require('../service/releaseNotesService');
const messageKeys = require('../utils/message-keys');
exports.getReleaseNotes = async (req, res) => {
    try {
        const releaseNotes = await releaseNotesService.getReleaseNotes();
        res.json(releaseNotes);
    } catch (error) {
        const msg = error.message;
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_RELEASE_NOTES,
            msg
        });
    }
};

