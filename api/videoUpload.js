const path = require('path');
const apiService = require('../service/apiService');
const userService = require('../service/userService');
const azureService = require('../service/azureService');
const uploadLogger = require('../config/uploadLogger');
const fsExtra = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const messageKeys = require('../utils/message-keys');
const constants = require('../utils/constants');
const {seriesTitleForLoggedUser} = require('../utils/helpers'); // helper functions
const jobsService = require('../service/jobsService');
const HttpStatus = require('http-status');
const dbApi = require('./dbApi');
const moment = require('moment');
const logger = require('../config/winstonLogger');

const ERROR_LEVEL = 'error';
const INFO_LEVEL = 'info';




// make sure the upload dir exists
const ensureUploadDir = async (directory) => {
    try {
        // https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md
        await fsExtra.ensureDir(directory);
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
        await fs.unlinkSync(filename);
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
    let description;
    let license;
    let title;
    let translationLanguage;

    req.busboy.on('field', (fieldname, val)  => {
        if (fieldname === 'archivedDate') {
            archivedDate = moment(new Date(val));
        }
        if (fieldname === 'selectedSeries') {
            selectedSeries = val;
        }
        if (fieldname === 'title') {
            title = val;
        }
        if (fieldname === 'description') {
            description = val;
        }
        if (fieldname === 'license') {
            license = val;
        }
        if (fieldname === 'translationLanguage') {
            translationLanguage = val;
        }
    });

    req.busboy.on('file', (field, file, filename) => {

        const startTime = new Date();
        uploadLogger.log(INFO_LEVEL, `Upload of '${filename.filename}' started  USER: ${req.user.eppn} -- ${uploadId}`);
        // path to the file
        const filePathOnDisk = path.join(uploadPath, filename.filename);

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
            const response = await apiService.uploadVideo(filePathOnDisk, filename.filename, selectedSeries ? selectedSeries : inboxSeries.identifier, description, title);

            if (response && response.status === HttpStatus.CREATED) {
                identifier = response.data.identifier;
                await jobsService.setJobStatus(uploadId, constants.JOB_STATUS_FINISHED);
                uploadLogger.log(INFO_LEVEL,
                    `${filename.filename} uploaded to lataamo-proxy in ${timeDiff} milliseconds. Opencast event ID: ${JSON.stringify(response.data)} USER: ${req.user.eppn} -- ${uploadId}`);

                const video = {identifier: identifier, created: new Date(), archivedDate: archivedDate};
                await dbApi.insertArchiveAndVideoCreationDatesForVideoUpload(video);
                res.status(HttpStatus.OK);

                // republish metadata in background operation
                const metadata = {title : title, isPartOf : selectedSeries ? selectedSeries : inboxSeries.identifier, description: description, license : license };
                const updateEventMetadataResponse = await apiService.updateEventMetadata(metadata, identifier, false, req.user.eppn);

                if (updateEventMetadataResponse.status === 200) {
                    logger.info(`update event metadata for VIDEO ${identifier} USER ${req.user.eppn} OK`);
                    // generate VTT file for the video
                    if (translationLanguage && process.env.ENVIRONMENT != "local") {
                        const vttFile = await azureService.startProcess(filePathOnDisk, uploadPath, translationLanguage, filename.filename);
                        const response = await apiService.addWebVttFile(vttFile, identifier);
                        if (response.status === 201) {
                            logger.info(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} UPLOADED`);
                            await apiService.republishWebVttFile(identifier);
                        } else {
                            logger.error(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} FAILED ${response.message}`);
                        }
                        await deleteFile(vttFile.originalname, uploadId);
                        await deleteFile(vttFile.audioFile, uploadId);
                    }
                } else if (updateEventMetadataResponse.status === 403){
                    logger.warn(`update event metadata for VIDEO ${identifier} USER ${req.user.eppn} failed ${updateEventMetadataResponse.statusText}`);
                } else {
                    logger.warn(`update event metadata for VIDEO ${identifier} USER ${req.user.eppn} failed ${updateEventMetadataResponse.statusText}`);
                }
                // clean file from disk
                await deleteFile(uploadPath, uploadId);
            } else {
                // on failure clean file from disk and return 500
                await deleteFile(uploadPath, uploadId);
                await jobsService.setJobStatus(uploadId, constants.JOB_STATUS_ERROR);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                const msg = `${filename.filename} failed to upload to opencast.`;
                uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId} ${response}`);
            }
        });
    });
};
