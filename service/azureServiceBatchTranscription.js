require('dotenv').config();
const fsPromises = require('fs/promises');
const extractAudio = require('ffmpeg-extract-audio');
const path = require('path');
const logger = require('../config/winstonLogger');

const { BlobServiceClient } = require('@azure/storage-blob');
const axios = require('axios');
const constants = require("../utils/constants");

// Set your Azure Storage account and Batch Transcription API key
const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
const storageAccountKey = process.env.STORAGE_ACCOUNT_KEY;
const storageContainerName = process.env.STORAGE_CONTAINER_NAME;
const transcriptionApiKey = process.env.TRANSCRIPTION_API_KEY;

// Speech Service Base URL and model information
const speechToTextBaseUrl = process.env.SPEECH_TO_TEXT_BASE_URL;
const speechToTextModel = process.env.SPEECH_TO_TEXT_MODEL;

// Set up headers for Batch Transcription API request
const headers = {
    'Ocp-Apim-Subscription-Key': transcriptionApiKey,
    'Content-Type': 'application/json',
};

const proxyConfig = {
    host: 'scan-proxy.it.helsinki.fi',
    port: 8080,
    protocol: 'http'
};

const axiosConfig = {
    headers
};

const axiosConfigProxy = {
    headers,
    proxy: proxyConfig,
};

const getConfig = () => {
    return process.env.ENVIRONMENT === 'oc-test' ? axiosConfigProxy : axiosConfig;
};

const audioFile = 'output_audio.wav'; // 16000 Hz, Mono
const outputFile = 'transcript.vtt';

// Set up Azure Batch Transcription API endpoint
const transcriptionEndpoint = `${speechToTextBaseUrl}/transcriptions`;

const sanitizeFilename = (filename, uploadId, eppn) => {
    logger.info(`Sanitizing filename ${filename} for uploadId ${uploadId} and username ${eppn}`);
    // Replace spaces with underscores
    let sanitizedFilename = filename.replace(/\s+/g, '_');

    // Replace dots with underscores
    sanitizedFilename = sanitizedFilename.replace(/\./g, '_');

    // Remove special characters and leave only alphanumeric, underscores, and hyphens
    sanitizedFilename = sanitizedFilename.replace(/[^a-zA-Z0-9_-]/g, '');
    logger.info(`Sanitizing complete for filename ${sanitizedFilename} for uploadId ${uploadId} and username ${eppn}`);

    return sanitizedFilename;
};

const uploadAudioToStorage = async (blobClient, outputAudio) => {
    // Upload audio file to Azure Storage
    logger.info('Uploading audio file to Azure Storage...');
    logger.info('Audio file: ' + outputAudio);
    await blobClient.uploadFile(outputAudio);
};

const initiateTranscriptionJob = async (blobClient, translationLanguage, uploadId, eppn, model) => {
    try {
        // Initiate transcription job
        logger.info('Initiating transcription job for uploadId ' + uploadId + ' and username ' + eppn + '...');
        const transcriptionRequest = {
            contentUrls: [blobClient.url],
            locale: translationLanguage, // Translation language code
            displayName: 'YourTranscriptionJobName', // Replace with a custom name for your job
            description: 'YourTranscriptionJobDescription', // Replace with a custom description for your job
            properties: {
                diarizationEnabled: false, // Set to true if you want speaker diarization
                profanityFilterMode: 'None', // Set to "Removed" if you want to remove profanity from the transcript
                addWordLevelTimestamps: false, // Set to true if you want word-level timestamps in the transcript
            }
        };

        // Set the model property if a custom model is used
        if (model === constants.TRANSLATION_MODEL_MS_WHISPER) {
            transcriptionRequest.model = {
                self: `${speechToTextBaseUrl}/models/base/${speechToTextModel}`
            };
        }

        if (model === constants.TRANSLATION_MODEL_MS_ASR) {
            // Dynamically add the languageIdentification property, only supported in the MS_ASR model
            transcriptionRequest.properties.languageIdentification = {
                candidateLocales: ["en-US", "sv-SE", "fi-FI"]
            };
        }


        const response = await axios.post(transcriptionEndpoint, transcriptionRequest, getConfig());
        return response.data;
    }  catch (error) {
        logger.error('Error initiating transcription job:', error.message);
        if (error.response) {
            logger.error('Response status:', error.response.status);
            logger.error('Response data:', error.response.data);
        }
        await deleteAudioFromStorage(blobClient, uploadId, eppn);
        throw error; // rethrow the error to be caught in the main try-catch block
    }
};

const waitForJobCompletion = async (jobInfo, uploadId, eppn, blobClient) => {
    if (!jobInfo || !jobInfo.self) {
        logger.error('Transcription job self URL not found in the initiation response.');
        return 'Failed'; // Return a failure status
    }

    const jobId = jobInfo.self.split('/').pop();

    if (!jobId) {
        logger.error('Failed to extract transcription job ID from the self URL.');
        logger.error('Self URL:', jobInfo.self);
        return 'Failed'; // Return a failure status
    }

    logger.info(`Waiting for transcription job ${jobId} for ${uploadId} and user ${eppn} to complete...`);

    try {
        let status = 'NotStarted';
        while (status !== 'Succeeded' && status !== 'Failed') {
            const response = await axios.get(jobInfo.self,  getConfig());
            status = response.data.status;
            logger.info(`Transcription job status: ${status}`);

            if (status !== 'Succeeded' && status !== 'Failed') {
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
            }
        }

        // Update jobInfo with the latest status
        jobInfo.status = status;

        if (status === 'Failed') {
            logger.error('Transcription job failed. Deleting the audio file from Azure Storage...');
            await deleteAudioFromStorage(blobClient, uploadId, eppn);
        }

        return status; // Return the final status
    } catch (error) {
        logger.error('Error checking transcription job status:', error.message);
        if (error.response) {
            logger.error('Response status:', error.response.status);
            logger.error('Response data:', error.response.data);
        }
        await deleteAudioFromStorage(blobClient, uploadId, eppn);
        return 'Failed'; // Return a failure status
    }
};

const getTranscriptionResult = async (jobInfo, uploadId, eppn, blobClient) => {
    try {
        // Check if jobInfo has a 'status' property indicating the job status
        if (jobInfo.status === 'Succeeded') {
            const jobId = jobInfo.self.split('/').pop();

            // Construct the endpoint to get information about the files associated with the transcription job
            const filesEndpoint = `${transcriptionEndpoint}/${jobId}/files`;

            // Fetch the list of files associated with the job
            const filesResponse = await axios.get(filesEndpoint, getConfig());

            if (Array.isArray(filesResponse.data.values)) {
                // Find the VTT file in the list of files
                const vttFile = filesResponse.data.values.find((file) => file.kind === 'Transcription');

                if (vttFile) {
                    const vttResultUrl = vttFile.links.contentUrl;

                    // Fetch the transcription result (VTT file)
                    const vttResultResponse = await axios.get(vttResultUrl, getConfig());

                    // Return the VTT content
                    return vttResultResponse.data;
                } else {
                    logger.error(`Transcription result (VTT) file not found in the response for job ${jobId} and uploadId ${uploadId} and user ${eppn}`);
                    await deleteAudioFromStorage(blobClient, uploadId, eppn);
                    return null;
                }
            } else {
                logger.error(`Invalid response data format. Expected an array of files. for job ${jobId} and uploadId ${uploadId} and user ${eppn}`);
                await deleteAudioFromStorage(blobClient, uploadId, eppn);
                return null;
            }
        } else {
            logger.error(`Transcription job is not in a successful state. Current status:` + ' ' + jobInfo.status + ' for uploadId ' + uploadId + ' and username ' + eppn);
            await deleteAudioFromStorage(blobClient, uploadId, eppn);
            return null;
        }
    } catch (error) {
        logger.error(`Error retrieving transcription result: ${error.message} for uploadId ${uploadId} and username ${eppn}`);
        if (error.response) {
            logger.error(`Response status: ${error.response.status} for uploadId ${uploadId} and username ${eppn}`);
            logger.error(`Response data: ${error.response.data} for uploadId ${uploadId} and username ${eppn}`);
        }
        await deleteAudioFromStorage(blobClient, uploadId, eppn);
        return null;
    }
};

const jsonToVtt = (jsonData, uploadId, eppn) => {
    const { recognizedPhrases } = jsonData;
    const vttLines = [];

    vttLines.push('WEBVTT');

    // Sort phrases based on start time
    const sortedPhrases = recognizedPhrases.slice().sort((a, b) => {
        const startTimeA = a.offsetInTicks / 10000000; // Convert ticks to seconds
        const startTimeB = b.offsetInTicks / 10000000;
        return startTimeA - startTimeB;
    });

    sortedPhrases.forEach((phrase, index) => {
        const { offsetInTicks, durationInTicks, nBest } = phrase;

        if (offsetInTicks  && durationInTicks && nBest && nBest.length > 0) {
            const startTimeInSeconds = offsetInTicks / 10000000; // Convert ticks to seconds
            const endTimeInSeconds = startTimeInSeconds + durationInTicks / 10000000;

            // Find the transcription with the highest confidence
            const highestConfidenceTranscription = nBest.reduce((prev, current) => {
                return (prev.confidence || 0) > (current.confidence || 0) ? prev : current;
            }, {});

            // Create VTT entry for the transcription with the highest confidence
            const vttEntry = [
                `${index + 1}`,
                `${formatTime(startTimeInSeconds)} --> ${formatTime(endTimeInSeconds)}`,
                highestConfidenceTranscription.display
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;')
            ];

            vttLines.push(vttEntry.join('\n'));
        } else {
            logger.error(`Missing required properties in phrase in index ${index}` + ' ' + JSON.stringify(phrase) + ' for uploadId ' + uploadId + ' and username ' + eppn);
        }
    });

    return vttLines.join('\n\n');
};

const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
};

const saveVttToFile = async (vttContent, filePath, uploadId, eppn) => {
    if (!vttContent) {
        logger.error(`No VTT content to save. for uploadId ${uploadId} and username ${eppn}`);
        return;
    }
    try {
        await fsPromises.writeFile(filePath, vttContent);
    } catch (error) {
        logger.error(`Error saving VTT content to file: ${error.message} for uploadId ${uploadId} and username ${eppn}`);
    }
    logger.info(`VTT content saved to: ${filePath} for uploadId ${uploadId} and username ${eppn}`);
};

const deleteTranscription = async (jobInfo, uploadId, eppn) => {
    try {
        const jobId = jobInfo.self.split('/').pop();
        await axios.delete(`${transcriptionEndpoint}/${jobId}`, getConfig());
        logger.info(`Transcription deleted: ${jobId} for uploadId ${uploadId} and username ${eppn}`);
    } catch (error) {
        logger.error(`Error deleting transcription:  ${error.message} for uploadId  ${uploadId} and username ${eppn}`);
    }
};

const deleteAudioFromStorage = async (blobClient, uploadId, eppn) => {
    // Delete the audio file from Azure Storage
    await blobClient.delete();
    logger.info(`Audio file deleted from Azure Storage for uploadId ${uploadId} and username ${eppn}`);
};

exports.startProcess = async (filePathOnDisk, uploadPath, translationLanguage, fileName, uploadId, eppn, model) => {
    try {
        // sanitize filename
        fileName = sanitizeFilename(fileName, uploadId, eppn);

        await extractAudio({
            input: filePathOnDisk,
            output: path.join(uploadPath, fileName + '_' + audioFile),
            transform: (cmd) => {
                cmd.audioChannels(1)
                    .audioFrequency(16000);
            }
        });

        logger.info('Sound ready for video : ' + filePathOnDisk + ' with translation language '+ translationLanguage + ' for uploadId ' + uploadId + ' and username ' + eppn);
        logger.info('Sound file location: ' + path.join(uploadPath, fileName + '_' + audioFile) + ' for uploadId ' + uploadId + ' and username ' + eppn);

        // Set up Azure Storage connection string
        const storageConnectionString = `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccountKey};EndpointSuffix=core.windows.net`;
        const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
        const containerClient = blobServiceClient.getContainerClient(storageContainerName);
        const relativeUploadPath = path.join('api','uploads', eppn, uploadId, fileName + '_' + audioFile);
        const blobClient = containerClient.getBlockBlobClient(relativeUploadPath);

        await uploadAudioToStorage(blobClient, relativeUploadPath);
        logger.info('Audio file uploaded to Azure Storage successfully' + ' for uploadId ' + uploadId + ' and username ' + eppn);

        const jobInfo = await initiateTranscriptionJob(blobClient, translationLanguage, uploadId, eppn, model);

        logger.info('Transcription job initiated:', jobInfo + ' for uploadId ' + uploadId + ' and username ' + eppn);

        const jobStatus = await waitForJobCompletion(jobInfo, uploadId, eppn, blobClient);

        if (jobStatus === 'Succeeded') {
            const transcriptionResult = await getTranscriptionResult(jobInfo, uploadId, eppn, blobClient);
            const vtt = jsonToVtt(transcriptionResult, uploadId, eppn);
            await saveVttToFile(vtt, path.join(uploadPath, fileName + '_' + outputFile), uploadId, eppn);
            await deleteTranscription(jobInfo, uploadId, eppn);
        } else {
            logger.error('Transcription job failed with status:' + jobStatus + ' for uploadId ' + uploadId + ' and username ' + eppn);
        }

        await deleteAudioFromStorage(blobClient, uploadId, eppn);
        return {
            buffer : await fsPromises.readFile(path.join(uploadPath, fileName + '_' + outputFile)),
            originalname : path.join(uploadPath, fileName + '_' + outputFile),
            audioFile : path.join(uploadPath, fileName + '_' + audioFile)
        };
    } catch (error) {
        logger.error('Error processing audio:', error);
    }
};
