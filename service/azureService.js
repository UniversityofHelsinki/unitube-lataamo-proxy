require('dotenv').config();
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const extractAudio = require('ffmpeg-extract-audio');
const path = require('path');
const logger = require('../config/winstonLogger');

const subscriptionKey = process.env.AZURE_SPEECH_SUBSCRIPTION_KEY;
const serviceRegion = 'northeurope'; // e.g., "westus"
const audioFile = 'output_audio.wav'; // 16000 Hz, Mono
const outputFile = 'transcript.vtt';

exports.startProcess = async (filePathOnDisk, uploadPath, translationLanguage) => {
    try {
        //extract audio from video file
        await extractAudio({
            input: filePathOnDisk,
            output: path.join(uploadPath, audioFile),
            transform: (cmd) => {
                cmd.audioChannels(1)
                    .audioFrequency(16000);
            }
        });
        logger.info('Sound ready for video : ' + filePathOnDisk + ' with translation language '+ translationLanguage);
        await processFile(path.join(uploadPath, audioFile), uploadPath, translationLanguage);
        return {
            buffer : fs.readFileSync(path.join(uploadPath, outputFile)),
            originalname : path.join(uploadPath + outputFile)
        };
    } catch (error) {
        logger.error('Error processing audio:', error);
    }
};


const createAudioConfig = (filename) => {
    const pushStream = sdk.AudioInputStream.createPushStream();

    fs.createReadStream(filename).on('data', arrayBuffer => {
        pushStream.write(arrayBuffer.slice());
    }).on('end', () => {
        pushStream.close();
    });

    return sdk.AudioConfig.fromStreamInput(pushStream);
};

const createRecognizer = (audiofilename, audioLanguage) => {
    const audioConfig = createAudioConfig(audiofilename);
    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechRecognitionLanguage = audioLanguage;
    speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, '14400000');
    if (process.env.ENVIRONMENT === 'oc-test') {
        speechConfig.setProxy('scan-proxy.it.helsinki.fi', '8080');
    }
    return new sdk.SpeechRecognizer(speechConfig, audioConfig);
};

const formatTimestamp = (timestamp100ns) => {
    const milliseconds = timestamp100ns / 10000;
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const formattedSeconds = String(seconds % 60).padStart(2, '0');
    const formattedMinutes = String(minutes % 60).padStart(2, '0');
    const formattedHours = String(hours).padStart(2, '0');

    const formattedMilliseconds = String(milliseconds % 1000).padStart(3, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
};


const processFile = async (audioFile, uploadPath, translationLanguage) => {
    const outputStream = fs.createWriteStream(path.join(uploadPath + outputFile));
    await new Promise((resolve, reject) => {
        outputStream.once('open', () => {
            outputStream.write('WEBVTT\r\n\r\n');

            let recognizer = createRecognizer(audioFile, translationLanguage);

            recognizer.recognized = (s, e) => {
                if (e.result.reason === sdk.ResultReason.NoMatch) {
                    const noMatchDetail = sdk.NoMatchDetails.fromResult(e.result);
                    logger.error('\r\n(recognized)  Reason: ' + sdk.ResultReason[e.result.reason] + ' | NoMatchReason: ' + sdk.NoMatchReason[noMatchDetail.reason]);
                } else {
                    //console.log(`\r\n(recognized)  Reason: ${sdk.ResultReason[e.result.reason]} | Duration: ${e.result.duration} | Offset: ${e.result.offset}`);
                    //console.log(`Text: ${e.result.text}`);
                    outputStream.write(`${formatTimestamp(e.result.offset)} --> ${formatTimestamp(e.result.offset + e.result.duration)}\r\n`);
                    outputStream.write(`${e.result.text}\r\n\r\n`);
                }
            };

            recognizer.canceled = (s, e) => {
                let str = '(cancel) Reason: ' + sdk.CancellationReason[e.reason];
                if (e.reason === sdk.CancellationReason.Error) {
                    str += ': ' + e.errorDetails;
                }
                logger.info(str);
            };

            recognizer.speechEndDetected = (s, e) => {
                logger.info(`(speechEndDetected) SessionId: ${e.sessionId}`);
                outputStream.close();
                recognizer.close();
                recognizer = undefined;
                resolve(); // Resolve the promise once everything is done
            };

            recognizer.startContinuousRecognitionAsync(() => {
                logger.info('Recognition started');
            },
            err => {
                logger.error('err - ' + err);
                outputStream.close();
                recognizer.close();
                recognizer = undefined;
                reject(err); // Reject the promise if there's an error
            });
        });
    });
};

