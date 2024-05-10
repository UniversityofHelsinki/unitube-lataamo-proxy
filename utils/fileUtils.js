const logger = require("../config/winstonLogger");
const webvttParser = require("node-webvtt");
const fs = require("fs-extra");
const uploadLogger = require("../config/uploadLogger");
const fsExtra = require("fs-extra");
const chardet = require('chardet');
const iconv = require('iconv-lite');

const ERROR_LEVEL = 'error';
const INFO_LEVEL = 'info';

const isEmptyDirectory = (path) => {
    return fs.readdirSync(path).length === 0;
};

exports.removeDirectory = async (uplaodPath, id, isUpload) => {
    try {
        if (isEmptyDirectory(uplaodPath)) {
            await fs.rmdirSync(uplaodPath);
            if (isUpload) {
                uploadLogger.log(INFO_LEVEL, `Cleaning - removed directory: ${uplaodPath} -- ${id}`);
            } else {
                logger.info(`Cleaning - removed directory: ${uplaodPath}`);
            }
        } else {
            if (isUpload) {
                uploadLogger.log(INFO_LEVEL, `Cleaning - directory not empty: ${uplaodPath} -- ${id}`);
            } else {
                logger.info(`Cleaning - directory not empty: ${uplaodPath}`);
            }
        }
    } catch(err) {
        uploadLogger.log(ERROR_LEVEL, `Failed to remove directory ${uplaodPath} | ${err} -- ${id}`);
    }
};

exports.ensureUploadDir = async (directory) => {
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

exports.areAllRequiredFiles = (vttFile, user, uploadId) => {
    if (vttFile.buffer && vttFile.buffer.length > 0 && vttFile.originalname && vttFile.audioFile) {
        return true;
    } else {
        logger.error(`vttFile is missing some required fields for user ${user} with uploadId ${uploadId}`);
        return false;
    }
};

exports.isValidVttFile = (vttFile, identifier, user) => {
    try {
        webvttParser.parse(vttFile.buffer.toString(), { strict: true });
        return true;
    } catch (err) {
        logger.error(`vtt file seems to be malformed (${err.message}) for video ${identifier}, please check. -- USER ${user}`);
        return false;
    }
};

exports.deleteFile = async (filename, id, isUpload) => {
    try{
        // https://github.com/jprichardson/node-fs-extra/blob/2b97fe3e502ab5d5abd92f19d588bd1fc113c3f2/docs/remove.md#removepath-callback
        await fs.unlinkSync(filename);
        if (isUpload) {
            uploadLogger.log(INFO_LEVEL, `Cleaning - removed: ${filename} -- ${id}`);
        } else {
            logger.info(`Cleaning - removed: ${filename}`);
        }
        return true;
    } catch (err){
        logger.error(`Failed to clean ${filename} | ${err} -- ${id}`);
        return false;
    }
};

exports.removeDirectory = async (uplaodPath, id, isUpload) => {
    try {
        if (isEmptyDirectory(uplaodPath)) {
            await fs.rmdirSync(uplaodPath);
            if (isUpload) {
                uploadLogger.log(INFO_LEVEL, `Cleaning - removed directory: ${uplaodPath} -- ${id}`);
            } else {
                logger.info(`Cleaning - removed directory: ${uplaodPath} -- ${id}`);
            }
        } else {
            if (isUpload) {
                uploadLogger.log(INFO_LEVEL, `Cleaning - directory not empty: ${uplaodPath} -- ${id}`);
            } else {
                logger.info(`Cleaning - directory not empty: ${uplaodPath} -- ${id}`);
            }
        }
    } catch(err) {
        logger.error(`Failed to remove directory ${uplaodPath} | ${err} -- ${id}`);
    }
};

/**
 * Converts vtt content to UTF-8 encoding.
 *
 * @param {object} translationObject - The object buffer to be converted to UTF-8 encoding.
 * @returns {object} The object buffer containing UTF-8 encoded string.
 */
exports.convertToUTF8 = async (translationObject) => {
    try {
        // Detect the input encoding using chardet
        const detectedEncoding = chardet.detect(translationObject.buffer);

        // If encoding detection fails or is unreliable, default to UTF-8
        const inputEncoding = detectedEncoding || 'UTF-8';

        logger.info(`detected text encoding of ${inputEncoding}`);

        // Convert the encoding to UTF-8
        const decoded = iconv.decode(translationObject.buffer, inputEncoding);

        logger.info(`decoding text with ${inputEncoding}`);

        const encoded = iconv.encode(decoded, 'utf8', {addBOM: true});

        logger.info('encoded text with utf8');

        return {
            ...translationObject,
            buffer : encoded
        };
    } catch (err) {
        console.error('Error converting file to UTF-8:', err);
        throw err;
    }
};




