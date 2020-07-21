const logger = require('../config/winstonLogger');
const cacheService = require('../service/cacheService');


exports.getJob = async jobId => {
    // no logging here because method gets called once per second by clients
    return await cacheService.get(jobId);
};

exports.setJobStatus = async (jobId, status) => {
    logger.info(`[JobsService] setJobStatus with JOB_ID: ${jobId} STATUS: ${status}`);
    await cacheService.updateCache(jobId, JSON.stringify({jobId, status: status}));
};

exports.removeJob = async jobId => {
    logger.info(`[JobsService] removeJob with JOB_ID: ${jobId}`);
    await cacheService.removeFromCache(jobId);
};
