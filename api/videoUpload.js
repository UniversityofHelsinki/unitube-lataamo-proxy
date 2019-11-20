
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

exports.upload = async (req, res) => {
    const uploadId = uuidv4();

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
            logger.error(`Error in returnOrCreateUsersInboxSeries ${err}`);
            throw err
        }
    };

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
    function deleteFile(filename, uploadId) {
        fs.unlink(filename, (err) => {
            if (err) {
                uploadLogger.log(ERROR_LEVEL, `Failed to clean ${filename} | ${err} -- ${uploadId}`);
            } else {
                uploadLogger.log(INFO_LEVEL, `Cleaning - removed ${filename} -- ${uploadId}`);
            }
        });
    };

    try {
        uploadLogger.log(INFO_LEVEL, `POST /userVideos - Upload video started. USER: ${req.user.eppn} -- ${uploadId}`);
        const uploadPath = path.join(__dirname, 'uploads/');

        if (!ensureUploadDir(uploadPath)) {
            // upload dir failed log and return error
            uploadLogger.log(ERROR_LEVEL, `Upload dir unavailable '${uploadPath}' USER: ${req.user.eppn} -- ${uploadId}`);
            res.status(500);
            const msg = 'Upload dir unavailable.';
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                msg,
                id: uploadId
            });
        }

        req.pipe(req.busboy); // Pipe it trough busboy

        let startTime;

        req.busboy.on('file', (fieldname, file, filename) => {
            startTime = new Date();
            uploadLogger.log(INFO_LEVEL, `Upload of '${filename}' started  USER: ${req.user.eppn} -- ${uploadId}`);
            const filePathOnDisk = path.join(uploadPath, filename);

            // Create a write stream of the new file
            const fstream = fs.createWriteStream(filePathOnDisk);
            // Pipe it trough
            file.pipe(fstream);

            // On finish of the file write to disk
            fstream.on('close', async () => {
                try {
                    const loggedUser = userService.getLoggedUser(req.user);
                    let timeDiff = new Date() - startTime;
                    uploadLogger.log(INFO_LEVEL,
                        `Loading time with busboy ${timeDiff} milliseconds USER: ${req.user.eppn} -- ${uploadId}`);

                    let inboxSeries;
                    try {
                        inboxSeries = await returnOrCreateUsersInboxSeries(loggedUser);

                        if (!inboxSeries || !inboxSeries.identifier) {
                            // on failure clean file from disk and return 500
                            deleteFile(filePathOnDisk, uploadId);
                            res.status(500)
                            const msg = `${filename} failed to resolve inboxSeries for user`;
                            uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId}`);
                            res.json({
                                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                                msg,
                                id: uploadId
                            });
                        }
                    } catch (err) {
                        // Log error and throw reason
                        throw "Failed to resolve user's inbox series";
                    }

                    try {
                        const response = await apiService.uploadVideo(filePathOnDisk, filename, inboxSeries.identifier);

                        if (response && response.status === 201) {
                            // on success clean file from disk and return 200
                            deleteFile(filePathOnDisk, uploadId);
                            res.status(200);
                            uploadLogger.log(INFO_LEVEL,
                                `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)} USER: ${req.user.eppn} -- ${uploadId}`);
                            res.json({message: `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)}`})
                        } else {
                            // on failure clean file from disk and return 500
                            deleteFile(filePathOnDisk, uploadId);
                            res.status(500);
                            const msg = `${filename} failed.`;
                            res.json({
                                message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                                msg,
                                id: uploadId
                            });
                        }
                    } catch (err) {
                        // Log error and throw reason
                        throw 'Failed to upload video to opencast';
                    }
                } catch (err) {
                    // catch and clean file from disk
                    // return response to user client
                    deleteFile(filePathOnDisk, uploadId);
                    res.status(500);
                    const msg = `Upload of ${filename} failed. ${err}.`;
                    uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId}`);
                    res.json({
                        message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
                        msg,
                        id: uploadId
                    });
                }
            });
        });
    } catch (err) {
        // catch and clean file from disk
        // TODO: filePathOnDisk is not defined here, remove file some other way
        // deleteFile(filePathOnDisk);
        // log error and return 500
        res.status(500);
        // TODO: ${filename} is not defined here log the file some other way
        const msg = `failed ${err}.`;
        uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
            msg,
            id: uploadId
        });
    }
};