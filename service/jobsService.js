const logger = require('../config/winstonLogger');
const cacheService = require('../service/cacheService');


exports.getJob = jobId => {
    let keys = cacheService.getKeys();
    let jobs = cacheService.getAll(keys);
    console.log(`finding job with jobId ${jobId} from jobs ` +  JSON.stringify(jobs));
    logger.info(`finding job with jobId ${jobId} from jobs ` +  JSON.stringify(jobs));
    let foundJob = cacheService.get(jobId);
    console.log("found job " , foundJob);
    return foundJob;
};

exports.setJobStatus = (jobId, status) => {
    let keys = cacheService.getKeys();
    let jobs = cacheService.getAll(keys);
    console.log(`updating job with jobId ${jobId} from jobs ` +  JSON.stringify(jobs));
    logger.info(`updating job with jobId ${jobId} from jobs ` +  JSON.stringify(jobs));
    cacheService.updateCache(jobId, {jobId, status: status});
};

exports.removeJob = jobId => {
    let keys = cacheService.getKeys();
    let jobs = cacheService.getAll(keys);
    logger.info(`removing job with jobId ${jobId} from jobs ` + JSON.stringify(jobs));
    cacheService.removeFromCache(jobId);
};