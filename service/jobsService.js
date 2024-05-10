const logger = require('../config/winstonLogger');
const cacheService = require('../service/cacheService');


exports.getJob = async jobId => {
    // no logging here because method gets called once per second by clients
    return await cacheService.get(jobId);
};

exports.setJobStatus = async (jobId, status) => {
    try {
        logger.info(`[JobsService] setJobStatus with JOB_ID: ${jobId} STATUS: ${status}`);
        await cacheService.updateCache(jobId, JSON.stringify({jobId, status: status}));
    } catch (exception) {
        logger.error(`[JobsService] setJobStatusForEvent error: ${exception}`);
    }
};

exports.setJobStatusForEvent = async (eventId, status, type) => {
    try {
        logger.info(`[JobsService] setJobStatus with EVENT_ID: ${eventId} STATUS: ${status}`);
        await cacheService.updateCache(eventId, JSON.stringify({eventId, type: type, status: status}));
    } catch (exception) {
        logger.error(`[JobsService] setJobStatusForEvent error: ${exception}`);
    }
};

exports.removeJob = async jobId => {
    try {
        logger.info(`[JobsService] removeJob with JOB_ID: ${jobId}`);
        await cacheService.removeFromCache(jobId);
    } catch (exception) {
        logger.error(`[JobsService] removeJob error: ${exception}`);
    }
};
