'use strict';

const userService = require('../service/userService');
const seriesService = require('../service/seriesService');
const eventsService = require('../service/eventsService');
const apiService = require('../service/apiService');
const publicationService = require('../service/publicationService');
const fileUtils = require('../utils/fileUtils');
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');
const webvttParser = require('node-webvtt');
const upload = require('../utils/upload');
const path = require('path');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const { parseSync, stringifySync } = require('subtitle');
const dbService = require('../service/dbService');
const constants = require('../utils/constants');
const dbApi = require('./dbApi');
const fileService = require('../service/fileService');
const {v4: uuidv4} = require('uuid');
const HttpStatus = require('http-status');
const azureServiceBatchTranscription = require('../service/azureServiceBatchTranscription');
const { areAllRequiredFiles , isValidVttFile, deleteFile, removeDirectory } = require('../utils/fileUtils');
const jobsService = require('../service/jobsService');
const {encrypt, decrypt} = require('../utils/encrption');

const encryptUrl = videoUrl => encrypt(videoUrl);



/**
 * Encrypts the video URL and VTT file URL (if present) in the given array of episode objects.
 *
 * @param {Array} episodeWithMediaUrls - An array of episode objects containing video and VTT file URLs.
 * @returns {Array} - An array of episode objects with encrypted video and VTT file URLs.
 */
const encryptVideoAndVTTUrls = episodeWithMediaUrls => {
    return episodeWithMediaUrls.map(episodeWithMediaUrl => {
        // making a shallow copy to avoiding changing of the original object
        let episodeCopy = { ...episodeWithMediaUrl };

        // encrypt the video URL
        const videoUrl = episodeCopy.url;
        const encryptedUrl = encryptUrl(videoUrl);
        episodeCopy.url = encryptedUrl;

        // encrypt the vttFile URL if it's present
        if (episodeCopy.vttFile && episodeCopy.vttFile.url) {
            // making a shallow copy to avoiding changing of the original object
            episodeCopy.vttFile = { ...episodeCopy.vttFile };

            episodeCopy.vttFile.filename = episodeCopy.vttFile.url.substring(episodeCopy.vttFile.url.lastIndexOf('/') + 1);
            const encryptedVTTFileUrl = encryptUrl(episodeCopy.vttFile.url);
            episodeCopy.vttFile.url = encryptedVTTFileUrl;
        }
        return episodeCopy;
    });
};

const parseVTTFileFromUrl = (response) => {
    return response.substring(response.lastIndexOf('/') + 1);
};

exports.vttFileFromUrl = (req, res) => {
    const url = decrypt(req.params.url);
    const vttFile = parseVTTFileFromUrl(url);
    res.json(vttFile);
};

exports.vttFile = async (req, res) => {
    const url = decrypt(req.params.url);
    const response = await apiService.downloadVttFile(url);
    // Get the file name from the URL
    const fileName = new URL(url).pathname.split('/').pop();
    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    response.body.pipe(res);
};

const calculateRangeHeaders = (req) => {
    const chunk_size = 5 * 2 ** 20; // 5MB
    let range = req.headers.range;
    if (range) {
        range = range.split('bytes=');
        let startAndEnd = range[1].split('-');
        if (startAndEnd) {
            let start = startAndEnd[0];
            let end = startAndEnd[1];
            if (!end || parseInt(end) > parseInt(start) + chunk_size) {
                end = parseInt(start) + chunk_size;
            }
            let rangeHeaders = `bytes=${start}-${end}`;
            return rangeHeaders;
        }
    } else {
        return range;
    }
};

exports.coverImage = async (req, res) => {
    try {
        logger.info(`GET cover image /coverImage/:id VIDEO ${req.params.id} USER: ${req.user.eppn}`);
        const url = decrypt(req.params.url);
        const response = await apiService.getCoverImage(url);
        res.set(response.headers);
        response.pipe(res);
    } catch (error) {
        const msg = error.message;
        logger.error(`GET /coverImage/:id VIDEO: ${req.params.id} USER: ${req.user.eppn} CAUSE: ${error}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_COVER_IMAGE,
            msg
        });
    }
};

exports.playVideo = async (req, res) => {
    try {
        logger.info(`GET play video url /video/play/:url VIDEO ${req.params.url} USER: ${req.user.eppn}`);
        const url = decrypt(req.params.url);
        let rangeHeaders = calculateRangeHeaders(req);
        const response = await apiService.playVideo(url, rangeHeaders);
        res.writeHead(206, response.headers);
        response.pipe(res);
    } catch (error) {
        const msg = error.message;
        logger.error(`GET /video/play/:url VIDEO: ${req.params.id} USER: ${req.user.eppn} CAUSE: ${error}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_PLAY_VIDEO_FROM_URL,
            msg
        });
    }
};

exports.getVideoUrl = async (req, res) => {
    try {
        logger.info(`GET video media url /videoUrl/:id VIDEO ${req.params.id} USER: ${req.user.eppn}`);
        const publications = await apiService.getPublicationsForEvent(req.params.id);
        //const filteredPublication = publicationService.filterEngagePlayerChannelPublication(publications);
        const mediaUrls = publicationService.getMediaUrlsFromPublication(req.params.id, publications);
        const episode = await apiService.getEpisodeForEvent(req.params.id);
        const episodeWithMediaUrls = await eventsService.getVttWithMediaUrls(episode, mediaUrls);
        res.json(encryptVideoAndVTTUrls(episodeWithMediaUrls));
    } catch (error) {
        const msg = error.message;
        logger.error(`GET /videoUrl/:id VIDEO: ${req.params.id} USER: ${req.user.eppn} CAUSE: ${error}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_VIDEO_URL,
            msg
        });
    }
};


exports.generateAutomaticTranscriptionsForVideo = async (req, res) => {
    let identifier = req.body.identifier;
    try {
        const transcriptionId = uuidv4();
        const loggedUser = userService.getLoggedUser(req.user);
        logger.info(`POST /generateAutomaticTranscriptionsForVideo VIDEO ${req.body.identifier} USER: ${req.user.eppn}`);
        let translationModel = req.body.translationModel;
        let translationLanguage = req.body.translationLanguage;
        if (identifier && translationModel && translationLanguage) {
            await jobsService.setJobStatusForEvent(identifier, constants.JOB_STATUS_STARTED, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
            res.status(HttpStatus.ACCEPTED);
            res.jobId = transcriptionId;
            res.json({id: transcriptionId, status: constants.JOB_STATUS_STARTED});
            // get video url from api and stream it to disk
            const publications = await apiService.getPublicationsForEvent(identifier);
            const mediaUrls = publicationService.getMediaUrlsFromPublication(identifier, publications);
            const videoUrl = mediaUrls[0].url;
            const result = await fileService.streamVideoToFile(req, res, videoUrl, transcriptionId);
            logger.info(`starting translation for VIDEO ${identifier} with translation model ${translationModel} and language ${translationLanguage} with USER ${req.user.eppn}`);
            let translationObject;
            // using Azure Speech to Text Batch Transcription API With Whisper Model to generate VTT file
            logger.info(`starting WHISPER translation for VIDEO ${identifier} with translation model ${translationModel} and language ${translationLanguage} with USER ${req.user.eppn}`);
            translationObject = await azureServiceBatchTranscription.startProcess(result.videoPath, result.videoBasePath, translationLanguage, result.fileName, transcriptionId, loggedUser.eppn, translationModel );

            if (areAllRequiredFiles(translationObject, req.user.eppn, identifier) && isValidVttFile(translationObject, identifier, req.user.eppn)) {
                const convertedTranslationObject = await fileUtils.convertToUTF8(translationObject);

                const response = await apiService.addWebVttFile(convertedTranslationObject, identifier, translationModel, translationLanguage);
                if (response.status === 201) {
                    logger.info(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} UPLOADED`);
                    await apiService.republishWebVttFile(identifier);
                    await deleteFile(convertedTranslationObject.originalname, transcriptionId, false);
                    await deleteFile(convertedTranslationObject.audioFile, transcriptionId, false);
                    await deleteFile(result.videoPath, transcriptionId, false);
                    // remove upload directory from disk
                    await removeDirectory(result.videoBasePath, transcriptionId, false);
                    await jobsService.setJobStatusForEvent(identifier, constants.JOB_STATUS_FINISHED, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
                } else {
                    logger.error(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} FAILED ${response.message}`);
                    await deleteFile(convertedTranslationObject.audioFile, transcriptionId, false);
                    await jobsService.setJobStatusForEvent(identifier, constants.JOB_STATUS_ERROR, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
                }
            } else {
                await deleteFile(translationObject.audioFile, transcriptionId, false);
                await jobsService.setJobStatusForEvent(identifier, constants.JOB_STATUS_ERROR, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
            }
        } else {
            logger.error(`POST /generateAutomaticTranscriptionsForVideo VIDEO: ${req.body.identifier} USER: ${req.user.eppn} CAUSE: ${messageKeys.ERROR_MESSAGE_MISSING_VIDEO_ID_OR_TRANSLATION_MODEL_OR_TRANSLATION_LANGUAGE}`);
            await jobsService.setJobStatusForEvent(identifier, constants.JOB_STATUS_ERROR, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
            res.status(HttpStatus.BAD_REQUEST);
        }
    } catch (error) {
        logger.error(`POST /generateAutomaticTranscriptionsForVideo VIDEO: ${req.body.identifier} USER: ${req.user.eppn} CAUSE: ${error}`);
        await jobsService.setJobStatusForEvent(identifier, constants.JOB_STATUS_ERROR, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }
};

exports.getUserVideosBySelectedSeries = async (req, res) => {
    try {
        logger.info(`GET /userVideosBySelectedSeries USER: ${req.user.eppn} , selected series : ${req.params.selectedSeries}` );
        const selectedSeries = req.params.selectedSeries;
        const loggedUser = userService.getLoggedUser(req.user);
        const allEventsWithMetaData = await eventsService.getAllEventsBySeriesIdentifier(selectedSeries);
        await getArchivedDate(allEventsWithMetaData);
        // insert removal date to postgres db
        await dbService.insertArchivedAndCreationDates(allEventsWithMetaData, loggedUser);
        res.json(eventsService.filterEventsForClientList(allEventsWithMetaData, loggedUser));
    } catch (error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error GET /userVideos ${error} ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_LIST_FOR_USER,
            msg
        });
    }
};

exports.getUserVideos = async (req, res) => {
    try {
        logger.info(`GET /userVideos USER: ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const ownSeries = await apiService.getUserSeries(loggedUser);
        const ownSeriesWithoutTrash = await seriesService.filterTrashSeries(ownSeries);
        const seriesIdentifiers = seriesService.getSeriesIdentifiers(ownSeriesWithoutTrash, loggedUser);
        const allEventsWithMetaData = await eventsService.getAllEventsBySeriesIdentifiers(seriesIdentifiers);
        const filteredAllEventsWithMetaData = allEventsWithMetaData.filter(item => item);
        const concatenatedEventsArray = eventsService.concatenateArray(filteredAllEventsWithMetaData);
        await getArchivedDate(concatenatedEventsArray);
        // insert removal date to postgres db
        await dbService.insertArchivedAndCreationDates(concatenatedEventsArray, loggedUser);
        const eventList = eventsService.filterEventsForClientList(concatenatedEventsArray, loggedUser).map(async event => ({
            ...event,
            deletionDate: await dbService.getArchivedDate(event.identifier),
            subtitles: await eventsService.subtitles(event.identifier)
        }));
        res.json(await Promise.all(eventList));
    } catch (error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error GET /userVideos ${error} ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_LIST_FOR_USER,
            msg
        });
    }
};

exports.updateArchivedDateOfVideosInSerie = async (req, res) => {
    try {
        logger.info(`PUT /updateArchivedDateOfVideosInSerie USER: ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const seriesIdentifier = req.params.id;
        const rawEventDeletionDateMetadata = req.body;
        const allEventsWithMetaData = await eventsService.getAllSerieEvents(seriesIdentifier);

        if (allEventsWithMetaData && allEventsWithMetaData.length > 0) {
            for (const video of allEventsWithMetaData) {
                logger.info(`insert deletion date with id : ${video.identifier}`);
                let response = await dbService.updateArchivedDate(video.identifier, rawEventDeletionDateMetadata, loggedUser);
                if (response.status === 200) {
                    logger.info(`PUT video deletion date /event/:id/updateArchivedDateOfVideosInSerie VIDEO ${req.params.id} USER ${req.user.eppn} OK`);
                    await dbService.clearNotificationSentAt(video.identifier, loggedUser);
                } else if (response.status === 404) {
                    logger.warn(`PUT video deletion date /event/:id/updateArchivedDateOfVideosInSerie VIDEO ${req.params.id} USER ${req.user.eppn} ${response.statusText}`);
                } else {
                    logger.error(`PUT video deletion date /event/:id/updateArchivedDateOfVideosInSerie VIDEO ${req.params.id} USER ${req.user.eppn} ${response.statusText}`);
                }
            }
            res.json({message: 'OK'});
        }
    } catch (error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error PUT /updateArchivedDateOfVideosInSerie ${error} ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_LIST_FOR_USER,
            msg
        });
    }
};

const getArchivedDate = async (concatenatedEventsArray) => {

    for (const element of concatenatedEventsArray) {
        try {
            let archived_date = await dbApi.returnArchivedDateFromDb(element.identifier);
            if (archived_date.rows.length === 1) {
                element.archived_date = [...archived_date.rows][0].archived_date;
            }
        } catch (error) {
            logger.error('error reading archived_date with video_id ' + element.identifier);
        }
    }
};

const isReturnedFromTrash = (video) => {
    if (video.series) {
        const seriesTitle = video.series.title ? video.series.title : video.series;
        return seriesTitle.toLowerCase().includes(constants.TRASH);
    } else {
        return false;
    }
};

exports.updateVideo = async (req, res) => {
    try {
        logger.info(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn}`);
        const loggedUser = userService.getLoggedUser(req.user);
        const rawEventMetadata = req.body;
        const response = await apiService.updateEventMetadata(rawEventMetadata, req.body.identifier, false, req.user);

        if (response.status === 200) {
            logger.info(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} OK`);
        } else if (response.status === 403){
            logger.warn(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
        } else {
            logger.error(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
        }

        if (isReturnedFromTrash(rawEventMetadata)) {
            await dbService.updateVideoToActiveState(req.body.identifier, req.user.eppn);
            await dbService.updateSkipEmailStatus(req.body.identifier, loggedUser, false);
            await dbService.clearNotificationSentAt(req.body.identifier, loggedUser);
        }

        res.status(response.status);
        res.json({message : response.statusText});
    } catch(error) {
        res.status(500);
        const msg = error.message;
        logger.error(`Error PUT /userVideos/:id ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DETAILS,
            msg
        });
    }
};

exports.downloadVideoFromUrl = async (req, res) => {
    try {
        logger.info(`GET download VIDEO USER ${req.user.eppn}`);
        const url = decrypt(req.params.url);
        const response = await apiService.downloadVideo(url);
        // Get the file name from the URL
        const fileName = new URL(url).pathname.split('/').pop();
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        response.body.pipe(res);
    } catch(error) {
        console.log('ERROR', error.message);
        res.status(500);
        const msg = error.message;
        logger.error(`Error PUT /userVideos/:id ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_DOWNLOAD_VIDEO,
            msg
        });
    }
};

exports.downloadVideo = async (req, res) => {
    try {
        logger.info(`POST download VIDEO ${req.body.mediaUrl} USER ${req.user.eppn}`);
        const response = await apiService.downloadVideo(req.body.mediaUrl);
        response.body.pipe(res);
    } catch(error) {
        console.log('ERROR', error.message);
        res.status(500);
        const msg = error.message;
        logger.error(`Error PUT /userVideos/:id ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_DOWNLOAD_VIDEO,
            msg
        });
    }
};



// buffer and original name are the desired, required properties of the subtitle file
const srtToVtt = (srtSubtitleFile) => {
    const convertedVtt = {};
    const nodes = parseSync(srtSubtitleFile.buffer.toString());
    convertedVtt.buffer = stringifySync(nodes, { format: 'WebVTT' });
    convertedVtt.originalname = srtSubtitleFile.originalname.slice(0, -4) + '.vtt';
    return convertedVtt;
};

const isVttFile = (fileMimeType) => {
    return fileMimeType === 'text/vtt';
};

const validateVTTFile = async (req, res, vttFile) => {
    try {
        if (!vttFile) {
            throw new Error('No file provided');
        }

        if (!isVttFile(vttFile.mimetype)) {
            logger.info(`Subtitle file not in a vtt format, trying to convert. [File: (${vttFile.filename}) MIME type: ${vttFile.mimetype}]. -- USER ${req.user.eppn}`);
            vttFile = srtToVtt(vttFile);
        }

        // https://www.npmjs.com/package/node-webvtt#parsing
        await webvttParser.parse(vttFile.buffer.toString(), { strict: true });
    } catch (err) {
        logger.error(`VTT file seems to be malformed (${err.message}), please check. -- USER ${req.user.eppn}`);
        throw new Error(`Malformed WebVTT file: ${err.message}`);
    }
};


/**
 * Handle vtt file upload.
 * Uses multer package to read form data: https://www.npmjs.com/package/multer
 * Uses node-webvtt package to validate vtt file: https://www.npmjs.com/package/node-webvtt
 * If the file is in srt format tries to convert it to vtt.
 *
 * file structure returned by multer:
 *  {
 *    fieldname: 'video_text_track_file',
 *    originalname: 'fulica.vtt',
 *    encoding: '7bit',
 *    mimetype: 'text/vtt',
 *    buffer: <Buffer xyz.....>,
 *    size: 226
 *  }
 *
 **/
exports.uploadVideoTextTrack = async (req, res) => {
    logger.info('addVideoTextTrack called.');
    upload(req, res, async () => {
        const eventId = req.body.eventId;
        let vttFile = req.file;
        // Validate VTT file
        try {
            await validateVTTFile(req, res, vttFile);
        } catch (validationError) {
            // Handle validation error
            logger.error(`VTT file validation failed: ${validationError.message} -- USER ${req.user.eppn}`);
            res.status(400);
            return res.json({ message: messageKeys.ERROR_MALFORMED_WEBVTT_FILE, error: validationError.message });
        }

        const convertedVttFile = await fileUtils.convertToUTF8(vttFile);

        await jobsService.setJobStatusForEvent(eventId, constants.JOB_STATUS_STARTED, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
        res.status(HttpStatus.ACCEPTED);
        res.jobId = eventId;
        res.json({id: eventId, status: constants.JOB_STATUS_STARTED});

        // Continue with the file upload logic
        try {
            const response = await apiService.addWebVttFile(convertedVttFile, eventId);

            if (response.status === 201) {
                logger.info(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} UPLOADED`);
                await apiService.republishWebVttFile(eventId);
                await jobsService.setJobStatusForEvent(eventId, constants.JOB_STATUS_FINISHED, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
            } else {
                logger.error(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} FAILED ${response.message}`);
                await jobsService.setJobStatusForEvent(eventId, constants.JOB_STATUS_ERROR, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
            }
        } catch (error) {
            console.log(error);
            logger.error(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} FAILED ${error}`);
            await jobsService.setJobStatusForEvent(eventId, constants.JOB_STATUS_ERROR, constants.JOB_STATUS_TYPE_TRANSCRIPTION);
            res.status(HttpStatus.BAD_REQUEST);
        }
    });
};


exports.deleteVideoTextTrack = async(req, res) => {
    logger.info('deleteVideoTextTrack called.');
    const filePath = path.join(__dirname, '../files/empty.vtt');

    const vttFile = fs.createReadStream(filePath);
    const eventId = req.params.eventId;

    try {
        const response = await apiService.deleteWebVttFile(vttFile, eventId);
        if (response.status === 201) {
            logger.info(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} DELETED`);
            res.status(response.status);
            await apiService.republishWebVttFile(eventId);
            res.json({message: messageKeys.SUCCESS_WEBVTT_UPLOAD});
        } else {
            logger.error(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} FAILED ${response.message}`);
            res.status(response.status);
            res.json({message: messageKeys.ERROR_WEBVTT_FILE_UPLOAD});
        }
    } catch (error) {
        res.status(error.status);
        res.json({message: error});
    }
};

exports.validateVTTFile = async (req, res) => {
    upload(req, res, async () => {
        try {
            let vttFile = req.file;
            await validateVTTFile(req, res, vttFile);

            // Move the response inside the try block
            return res.json({ message: messageKeys.SUCCESS_WEBVTT_UPLOAD });
        } catch (validationError) {
            // Handle validation error
            logger.error(`VTT file validation failed: ${validationError.message} -- USER ${req.user.eppn}`);
            res.status(400);
            return res.json({ message: messageKeys.ERROR_MALFORMED_WEBVTT_FILE, error: validationError.message });
        }
    });
};


