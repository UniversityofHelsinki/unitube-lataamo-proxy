// For WebVTT file upload (https://www.npmjs.com/package/multer)
const multer  = require('multer');
const filter = require('../utils/textTrackFileFilter');
const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: memoryStorage,
    limits: {
        files: 1,
        fieldSize: 1000
    },
    fileFilter: filter.textTrackFilter
}).single('video_text_track_file'); // the file input field name in the submitting form

module.exports = upload;
