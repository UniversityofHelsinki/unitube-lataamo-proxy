const logger = require('../config/winstonLogger');
const cacheService = require('../service/cacheService');


exports.getJob = async jobId => {
    let jobs = await cacheService.getKeys();
    logger.info(`getting job with jobId ${jobId} from jobs ` + jobs);
    return await cacheService.get(jobId);
};

exports.setJobStatus = async (jobId, status) => {
    let jobs = await cacheService.getKeys();
    logger.info(`updating job with jobId ${jobId} from jobs ` + jobs);
    await cacheService.updateCache(jobId, JSON.stringify({jobId, status: status}));
};

exports.removeJob = async jobId => {
    let jobs = await cacheService.getKeys();
    logger.info(`removing job with jobId ${jobId} from jobs ` + jobs);
    await cacheService.removeFromCache(jobId);
};