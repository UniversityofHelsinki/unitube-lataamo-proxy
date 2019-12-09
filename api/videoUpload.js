
const path = require('path');
const apiService = require('../service/apiService');
const userService = require('../service/userService');
const uploadLogger = require('../config/uploadLogger');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const uuidv4 = require('uuid/v4');
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');
const {inboxSeriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions

const ERROR_LEVEL = 'error';
const INFO_LEVEL = 'info';


// make sure the upload dir exists
const ensureUploadDir = async (directory) => {
    try {
        // https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md
        await fs.ensureDir(directory)
        logger.info(`Using uploadPath ${directory}`);
        return true;
    } catch (err) {
        logger.error(`Error in ensureUploadDir ${err}`);
        return false;
    }
};

// clean after post
const deleteFile = async (filename, uploadId) => {
    try{
        // https://github.com/jprichardson/node-fs-extra/blob/2b97fe3e502ab5d5abd92f19d588bd1fc113c3f2/docs/remove.md#removepath-callback
        await fs.remove(filename);
        uploadLogger.log(INFO_LEVEL, `Cleaning - removed: ${filename} -- ${uploadId}`);
        return true;
    }catch (err){
        uploadLogger.log(ERROR_LEVEL, `Failed to clean ${filename} | ${err} -- ${uploadId}`);
        return false;
    }
};

// get inbox series for user
const returnOrCreateUsersInboxSeries = async (loggedUser) => {
    const lataamoInboxSeriesTitle = inboxSeriesTitleForLoggedUser(loggedUser.eppn);

    try {
        const userSeries = await apiService.getUserSeries(loggedUser);
        let inboxSeries = userSeries.find(series => series.title === lataamoInboxSeriesTitle);

        if (!inboxSeries) {
            logger.info(`inbox series not found with title ${lataamoInboxSeriesTitle}`);
            inboxSeries = await apiService.createLataamoInboxSeries(loggedUser.eppn);
            logger.info(`Created inbox ${inboxSeries}`);
        }
        return inboxSeries;
    }catch(err){
        logger.error(`Error in returnOrCreateUsersInboxSeries USER: ${loggedUser.eppn} ${err}`);
        return false;
    }
};


exports.upload = async (req, res) => {
    const uploadId = uuidv4();
    const loggedUser = userService.getLoggedUser(req.user);
    const uploadPath = path.join(__dirname, 'uploads/');

    uploadLogger.log(INFO_LEVEL, `POST /userVideos - Upload video started. USER: ${req.user.eppn} -- ${uploadId}`);

    if (!ensureUploadDir(uploadPath)) {
        // upload dir failed log and return error
        uploadLogger.log(ERROR_LEVEL, `Upload dir unavailable '${uploadPath}' USER: ${req.user.eppn} -- ${uploadId}`);
        res.status(500);
        const msg = 'Upload dir unavailable.';
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
            msg,
            id: uploadId
        });
    }

    // get inbox series for user
    const inboxSeries = await returnOrCreateUsersInboxSeries(loggedUser);

    if (!inboxSeries) {
        res.status(500);
        const msg = `Failed to resolve inboxSeries for user.`;
        uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId}`);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
            msg,
            id: uploadId
        });
    }

    req.pipe(req.busboy); // Pipe it trough busboy

    req.busboy.on('file', (fieldname, file, filename) => {
        const startTime = new Date();
        uploadLogger.log(INFO_LEVEL, `Upload of '${filename}' started  USER: ${req.user.eppn} -- ${uploadId}`);
        // path to the file
        const filePathOnDisk = path.join(uploadPath, filename);

        // Create a write stream of the new file
        const fstream = fs.createWriteStream(filePathOnDisk);
        // Pipe it trough
        file.pipe(fstream);

        // On finish of the file write to disk
        fstream.on('close', async () => {

            const timeDiff = new Date() - startTime;
            uploadLogger.log(INFO_LEVEL,
                `Loading time with busboy ${timeDiff} milliseconds USER: ${req.user.eppn} -- ${uploadId}`);

            // try to send the file to opencast
            const response = await apiService.uploadVideo(filePathOnDisk, filename, inboxSeries.identifier);

            if (response && response.status === 201) {
                // on success clean file from disk and return 200
                deleteFile(filePathOnDisk, uploadId);
                res.status(200);
                uploadLogger.log(INFO_LEVEL,
                    `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)} USER: ${req.user.eppn} -- ${uploadId}`);
                const msg = `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)}`;
                return res.json({
                    message: messageKeys.SUCCESS_MESSAGE_VIDEO_UPLOAD,
                    msg,
                    id: uploadId
                })
            } else {
                // on failure clean file from disk and return 500
                deleteFile(filePathOnDisk, uploadId);
                res.status(500);
                const msg = `${filename} failed to upload to opencast.`;
                uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId} ${response}`);
                return res.json({
                    message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                    msg,
                    id: uploadId
                });
            }
        });
    });
};