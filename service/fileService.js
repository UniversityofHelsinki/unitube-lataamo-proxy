const fs = require("fs-extra");
const apiService = require("./apiService");
const {basename} = require("path");
const path = require("path");
const fsExtra = require("fs-extra");
const userService = require("./userService");
const logger = require('../config/winstonLogger');

exports.streamVideoToFile = async (req, res, videoUrl, transcriptionId) => {
    try {
        const loggedUser = userService.getLoggedUser(req.user);
        logger.info(`Start of streamVideoToFile for transcriptionId: ${transcriptionId} and user: ${loggedUser.eppn}`);

        // Parse the URL
        const parsedUrl = new URL(videoUrl);

        // Get the file name from the path
        const fileName = basename(parsedUrl.pathname);

        const videoBasePath = path.join('api','uploads', loggedUser.eppn, transcriptionId);
        await fsExtra.ensureDir(videoBasePath);

        const videoPath = path.join(videoBasePath, fileName);

        const customHighWaterMark = 1024 * 1024; // 1 MB
        const writeStream = fs.createWriteStream(videoPath, { highWaterMark: customHighWaterMark });
        const remoteVideoStream = await apiService.streamVideo(videoUrl);

        // Pipe the remote video stream directly to the file
        remoteVideoStream.pipe(writeStream);

        // Wait for the writeStream to finish writing
        await new Promise((resolve, reject) => {
            writeStream.once('finish', () => {
                logger.info(`Complete video saved to disk: ${videoPath} for transcriptionId: ${transcriptionId} and user: ${loggedUser.eppn}`);
                resolve();
            });

            // Handle errors during the writeStream
            writeStream.once('error', (err) => {
                logger.error('Error writing to file: ' + videoPath  + ' for transcriptionId: ' + transcriptionId + ' and user: '  + loggedUser.eppn, err.message);
                reject(err);
            });
        });

        // End the response when the file writing is completed
        res.end();
        logger.info('End of stream for file: ' + videoPath + ' for transcriptionId: ' + transcriptionId + ' and user: ' + loggedUser.eppn);
        return {videoBasePath: videoBasePath, videoPath: videoPath, fileName: fileName};
    } catch (error) {
        logger.error('Error streaming video:', error.message);
        logger.error(error);  // Log the entire error object for more details
        res.status(500).send('Internal Server Error');
    }
};
