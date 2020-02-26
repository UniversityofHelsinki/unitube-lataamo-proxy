//
// Multer file filter for vtt (WebVTT) file upload
// https://www.npmjs.com/package/multer#filefilter
// https://stackabuse.com/handling-file-uploads-in-node-js-with-expres-and-multer/
// https://www.w3.org/TR/webvtt1/

const vttFileFilter = function(req, file, cb) {
    // Accept vtt files only
    if (!file.originalname.match(/\.(vtt)$/)) {
        req.fileValidationError = 'Wrong file format. Only vtt files are supported.';
        return cb(new Error('Wrong file format. Only vtt files are supported.'), false);
    }
    cb(null, true);
};

exports.vttFilter = vttFileFilter;