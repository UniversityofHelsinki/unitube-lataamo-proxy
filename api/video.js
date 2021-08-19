'use strict';

const userService = require('../service/userService');
const seriesService = require('../service/seriesService');
const eventsService = require('../service/eventsService');
const apiService = require('../service/apiService');
const publicationService = require('../service/publicationService');
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');
const webvttParser = require('node-webvtt');
const upload = require('../utils/upload');
const path = require('path');
const fs = require('fs-extra'); // https://www.npmjs.com/package/fs-extra
const { parseSync, stringifySync } = require('subtitle');

exports.getVideoUrl = async (req, res) => {
    let debugStage = 0;
    try {
        logger.info(`GET video media url /videoUrl/:id VIDEO ${req.params.id} USER: ${req.user.eppn}`);
        const publications = await apiService.getPublicationsForEvent(req.params.id);
        debugStage = 1;
        const filteredPublication = publicationService.filterApiChannelPublication(publications);
        debugStage = 2;
        const mediaUrls = publicationService.getMediaUrlsFromPublication(req.params.id, filteredPublication);
        debugStage = 3;
        const episode = await apiService.getEpisodeForEvent(req.params.id);
        debugStage = 4;
        const episodeWithMediaUrls = await eventsService.getVttWithMediaUrls(episode, mediaUrls);
        debugStage = 5;
        res.json(episodeWithMediaUrls);
    } catch (error) {
        const msg = error.message;
        logger.error(`GET /videoUrl/:id VIDEO: ${req.params.id} USER: ${req.user.eppn} DEBUG-STAGE: ${debugStage} CAUSE: ${error}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_VIDEO_URL,
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
        const allEvents = await eventsService.getAllEvents(seriesIdentifiers);
        const concatenatedEventsArray = eventsService.concatenateArray(allEvents);
        const allEventsWithMetaDatas = await eventsService.getAllEventsWithMetadatas(concatenatedEventsArray);
        const allEventsWithMedia = await eventsService.getEventsWithMedia(allEventsWithMetaDatas);
        const allEventsWithMediaFile = await eventsService.getAllEventsWithMediaFileMetadata(allEventsWithMedia);
        const allEventsWithAcls = await eventsService.getAllEventsWithAcls(allEventsWithMediaFile);
        res.json(eventsService.filterEventsForClient(allEventsWithAcls));
    } catch (error) {
/*        if(error.message === 'read ECONNRESET' || error.message === 'socket hang up' ){
            // wait and rerun, or handle connection and rerun
            logger.error(`Error GET /userVideos ${error.message} USER ${req.user.eppn}`);
            console.log(error.message);
            return;
        }*/
        res.status(500);
        const msg = error.message;
        logger.error(`Error GET /userVideos ${msg} USER ${req.user.eppn}`);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_EVENT_LIST_FOR_USER,
            msg
        });

    }
};

exports.updateVideo = async (req, res) => {
    try {
        logger.info(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn}`);

        const rawEventMetadata = req.body;
        const response = await apiService.updateEventMetadata(rawEventMetadata, req.body.identifier, false, req.user);

        if (response.status === 200) {
            logger.info(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} OK`);
        } else if (response.status === 403){
            logger.warn(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
        } else {
            logger.error(`PUT /userVideos/:id VIDEO ${req.body.identifier} USER ${req.user.eppn} ${response.statusText}`);
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
exports.uploadVideoTextTrack = async(req, res) => {
    // https://attacomsian.com/blog/express-file-upload-multer
    // https://www.npmjs.com/package/multer
    logger.info('addVideoTextTrack called.');
    upload(req, res, async(err) => {
        if ( err ) {
            res.status(500);
            return res.json({ message: messageKeys.ERROR_MALFORMED_WEBVTT_FILE });
        }

        let vttFile = req.file;
        const eventId = req.body.eventId;

        if (!vttFile) {
            res.status(400);
            return res.json({
                message: 'The vtt file is missing.',
                msg: 'The vtt file is missing.'
            });
        }

        try {
            if (!isVttFile(vttFile.mimetype) ) {
                logger.info(`Subtitle file not in a vtt format, trying to convert. [File: (${vttFile.filename}) MIME type: ${vttFile.mimetype}]. -- USER ${req.user.eppn}`);
                vttFile = srtToVtt(vttFile);
            }
            // https://www.npmjs.com/package/node-webvtt#parsing
            webvttParser.parse(vttFile.buffer.toString(), { strict: true });
        } catch (err) {
            logger.error(`vtt file seems to be malformed (${err.message}), please check. -- USER ${req.user.eppn}`);
            res.status(400);
            return res.json({
                message: messageKeys.ERROR_MALFORMED_WEBVTT_FILE,
                msg: err.message
            });
        }

        try {
            const response = await apiService.addWebVttFile(vttFile, eventId);
            if (response.status === 201) {
                logger.info(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} UPLOADED`);
                res.status(response.status);
                res.json({message: messageKeys.SUCCESS_WEBVTT_UPLOAD});
            } else {
                logger.error(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} FAILED ${response.message}`);
                res.status(response.status);
                res.json({message : messageKeys.ERROR_WEBVTT_FILE_UPLOAD});
            }
        } catch (error) {
            res.status(error.status);
            res.json({message : error});
        }
    });
};

exports.deleteVideoTextTrack = async(req, res) => {
    logger.info('deleteVideoTextTrack called.');
    const filePath = path.join(__dirname, `../files/empty.vtt`);
    const vttFile = fs.createReadStream(filePath);
    const eventId = req.params.eventId;

    try {
        const response = await apiService.deleteWebVttFile(vttFile, eventId);
        if (response.status === 201) {
            logger.info(`POST /files/ingest/addAttachment VTT file for USER ${req.user.eppn} DELETED`);
            res.status(response.status);
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
