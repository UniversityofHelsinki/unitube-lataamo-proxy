const path = require('path');
const apiService = require('../service/apiService');
const userService = require('../service/userService');
const azureService = require('../service/azureService');
const azureServiceBatchTranscription = require('../service/azureServiceBatchTranscription');
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
const webvttParser = require('node-webvtt');

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

const isEmptyDirectory = (path) => {
    return fs.readdirSync(path).length === 0;
};

const removeDirectory = async (uplaodPath, uploadId) => {
    try {
        if (isEmptyDirectory(uplaodPath)) {
            await fs.rmdirSync(uplaodPath);
            uploadLogger.log(INFO_LEVEL, `Cleaning - removed directory: ${uplaodPath} -- ${uploadId}`);
        } else {
            uploadLogger.log(INFO_LEVEL, `Cleaning - directory not empty: ${uplaodPath} -- ${uploadId}`);
        }
    } catch(err) {
        uploadLogger.log(ERROR_LEVEL, `Failed to remove directory ${uplaodPath} | ${err} -- ${uploadId}`);
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

const isValidVttFile = (vttFile, identifier, user) => {
    try {
        webvttParser.parse(vttFile.buffer.toString(), { strict: true });
        return true;
    } catch (err) {
        logger.error(`vtt file seems to be malformed (${err.message}) for video ${identifier}, please check. -- USER ${user}`);
        return false;
    }
};


const areAllRequiredFiles = (vttFile, user, uploadId) => {
    if (vttFile.buffer && vttFile.buffer.length > 0 && vttFile.originalname && vttFile.audioFile) {
        return true;
    } else {
        logger.error(`vttFile is missing some required fields for user ${user} with uploadId ${uploadId}`);
        return false;
    }
};

exports.upload = async (req, res) => {
    const uploadId = uuidv4();
    const loggedUser = userService.getLoggedUser(req.user);
    const uploadPath = path.join(__dirname, `uploads/${loggedUser.eppn}/${uploadId}`);

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
    let translationModel;

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
        if (fieldname === 'translationModel') {
            translationModel = val;
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
                    logger.info (`selected translation for VIDEO ${identifier} with language ${translationLanguage}`);
                    // generate VTT file for the video
                    if (translationModel && translationLanguage) {
                        logger.info(`starting translation for VIDEO ${identifier} with translation model ${translationModel} and language ${translationLanguage} with USER ${req.user.eppn}`);
                        let translationObject;
                        // using Azure Speech to Text API to generate VTT file
                        if (translationModel === constants.TRANSLATION_MODEL_MS_ASR) {
                            logger.info(`starting MS_ASR translation for VIDEO ${identifier} with translation model ${translationModel} and language ${translationLanguage} with USER ${req.user.eppn}`);
                            translationObject = await azureService.startProcess(filePathOnDisk, uploadPath, translationLanguage, filename.filename);
                        } else if (translationModel === constants.TRANSLATION_MODEL_MS_WHISPER) {
                            // using Azure Speech to Text Batch Transcription API With Whisper Model to generate VTT file
                            logger.info(`starting WHISPER translation for VIDEO ${identifier} with translation model ${translationModel} and language ${translationLanguage} with USER ${req.user.eppn}`);
                            translationObject = await azureServiceBatchTranscription.startProcess(filePathOnDisk, uploadPath, translationLanguage, filename.filename, uploadId, loggedUser.eppn);
                        }
                        if (areAllRequiredFiles(translationObject, req.user.eppn, identifier) && isValidVttFile(translationObject, identifier, req.user.eppn)) {
                            const response = await apiService.addWebVttFile(translationObject, identifier);
                            if (response.status === 201) {
                                logger.info(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} UPLOADED`);
                                await apiService.republishWebVttFile(identifier);
                                await deleteFile(translationObject.originalname, uploadId);
                                await deleteFile(translationObject.audioFile, uploadId);
                            } else {
                                logger.error(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} FAILED ${response.message}`);
                                await deleteFile(translationObject.audioFile, uploadId);
                            }
                        } else {
                            await deleteFile(translationObject.audioFile, uploadId);
                        }
                    }
                } else if (updateEventMetadataResponse.status === 403){
                    logger.warn(`update event metadata for VIDEO ${identifier} USER ${req.user.eppn} failed ${updateEventMetadataResponse.statusText}`);
                } else {
                    logger.warn(`update event metadata for VIDEO ${identifier} USER ${req.user.eppn} failed ${updateEventMetadataResponse.statusText}`);
                }
                // clean file from disk
                await deleteFile(filePathOnDisk, uploadId);
                // remove upload directory from disk
                await removeDirectory(uploadPath, uploadId);
            } else {
                // on failure clean file from disk and return 500
                await deleteFile(filePathOnDisk, uploadId);
                // remove upload directory from disk
                await removeDirectory(uploadPath, uploadId);
                await jobsService.setJobStatus(uploadId, constants.JOB_STATUS_ERROR);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
                const msg = `${filename.filename} failed to upload to opencast.`;
                uploadLogger.log(ERROR_LEVEL, `POST /userVideos ${msg} USER: ${req.user.eppn} -- ${uploadId} ${response}`);
            }
        });
    });
};
