//
// Multer file filter for vtt (WebVTT) file upload
// https://www.npmjs.com/package/multer#filefilter
// https://stackabuse.com/handling-file-uploads-in-node-js-with-expres-and-multer/
// https://www.w3.org/TR/webvtt1/

const textTrackFileFilter = function(req, file, cb) {
    // Accept vtt and srt files only
    if (!(file.originalname.match(/\.(vtt)$/) || file.originalname.match(/\.(srt)$/))) {
        req.fileValidationError = 'Wrong file format. Only vtt and srt files are supported.';
        return cb(new Error('Wrong file format. Only vtt and srt files are supported.'), false);
    }
    cb(null, true);
};

exports.textTrackFilter = textTrackFileFilter;
