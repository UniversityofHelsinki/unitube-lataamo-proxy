
const path = require('path');
const apiService = require('../service/apiService');
const userService = require('../service/userService');
const uploadLogger = require('../config/uploadLogger');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const { v4: uuidv4 } = require('uuid');
const messageKeys = require('../utils/message-keys');
const constants = require('../utils/constants');
const {seriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions
const jobsService = require('../service/jobsService');
const HttpStatus = require('http-status');
const dbApi = require("./dbApi");
const moment = require('moment');

const ERROR_LEVEL = 'error';
const INFO_LEVEL = 'info';




// make sure the upload dir exists
const ensureUploadDir = async (directory) => {
    try {
        // https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md
        await fs.ensureDir(directory);
        uploadLogger.log(INFO_LEVEL,`Using uploadPath ${directory}`);
        return true;
    } catch (err) {
        uploadLogger.log(ERROR_LEVEL,`Error in ensureUploadDir ${err}`);
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

const returnUsersInboxSeries = async (loggedUser) => {
    const lataamoInboxSeriesTitle = seriesTitleForLoggedUser(constants.INBOX, loggedUser.eppn);

    try {
        const userSeries = await apiService.getUserSeries(loggedUser);
        let inboxSeries = userSeries.find(series => series.title === lataamoInboxSeriesTitle);

        if (!inboxSeries) {
            uploadLogger.log(INFO_LEVEL,`inbox series not found with title ${ lataamoInboxSeriesTitle }`);
            uploadLogger.log(INFO_LEVEL,`Created inbox ${ inboxSeries }`);
        }
        return inboxSeries;
    } catch (err) {
        uploadLogger.log(ERROR_LEVEL,`Error in returnOrCreateUsersInboxSeries USER: ${ loggedUser.eppn } ${ err }`);
        return false;
    }
};


exports.upload = async (req, res) => {
    const uploadId = uuidv4();
    const loggedUser = userService.getLoggedUser(req.user);
    const uploadPath = path.join(__dirname, `uploads/${loggedUser.eppn}/`);

    uploadLogger.log(INFO_LEVEL, `POST /userVideos - Upload video started. USER: ${req.user.eppn} -- ${uploadId}`);

    if (!await ensureUploadDir(uploadPath)) {
        // upload dir failed log and return error
        uploadLogger.log(ERROR_LEVEL, `Upload dir unavailable '${uploadPath}' USER: ${req.user.eppn} -- ${uploadId}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
        const msg = 'Upload dir unavailable.';
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
            msg,
            id: uploadId
        });
    }

    // get inbox series for user
    const inboxSeries = await returnUsersInboxSeries(loggedUser);

    if (!inboxSeries) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
        const msg = 'Failed to resolve inboxSeries for user.';
        uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId}`);
        return res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
            msg,
            id: uploadId
        });
    }

    req.pipe(req.busboy); // Pipe it trough busboy

    let archivedDate;
    let identifier;
    let selectedSeries;

    req.busboy.on('field', (fieldname, val)  => {
        if (fieldname === 'archivedDate') {
            archivedDate = moment(new Date(val));
        }
        if (fieldname === 'selectedSeries') {
            selectedSeries = val;
        }
    });

    req.busboy.on('file', (field, file, filename) => {

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

            // set upload job status
            await jobsService.setJobStatus(uploadId, constants.JOB_STATUS_STARTED);
            res.status(HttpStatus.ACCEPTED);
            res.jobId = uploadId;
            res.json({id: uploadId, status: constants.JOB_STATUS_STARTED});

            // try to send the file to opencast
            const response = await apiService.uploadVideo(filePathOnDisk, filename, selectedSeries ? selectedSeries : inboxSeries.identifier);

            if (response && response.status === HttpStatus.CREATED) {
                // on success clean file from disk and return 200
                await deleteFile(uploadPath, uploadId);
                await jobsService.setJobStatus(uploadId, constants.JOB_STATUS_FINISHED);
                uploadLogger.log(INFO_LEVEL,
                    `${filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)} USER: ${req.user.eppn} -- ${uploadId}`);
                identifier = response.data.identifier;

                const video = {identifier: identifier, created: new Date(), archivedDate: archivedDate};
                await dbApi.insertArchiveAndVideoCreationDatesForVideoUpload(video);

                res.status(HttpStatus.OK);
            } else {
                // on failure clean file from disk and return 500
                await deleteFile(uploadPath, uploadId);
                await jobsService.setJobStatus(uploadId, constants.JOB_STATUS_ERROR);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                const msg = `${filename} failed to upload to opencast.`;
                uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId} ${response}`);
            }
        });
    });
};
