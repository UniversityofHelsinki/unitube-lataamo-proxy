const logger = require('../config/winstonLogger');

let jobs = [];

exports.getJob = jobId => {
    logger.info(`finding job with jobId ${jobId} from jobs ` +  JSON.stringify(jobs));
    return jobs.find(job => job.id === jobId);
};

exports.setJobStatus = (jobId, status) => {
    if (jobs.length > 0 ) {
        let foundJob = jobs.find(job => {
            return job.id === jobId;
        });

        if (foundJob) {
            foundJob.status = status;
        } else {
            jobs.push({id: jobId, status: status});
        }
    } else {
        jobs.push({id: jobId, status: status});
    }
};

exports.removeJob = jobId => {
    logger.info(`removing job with jobId ${jobId} from jobs ` + JSON.stringify(jobs));
    if (jobs.length > 0) {
        jobs = jobs.filter(job => job.id !== jobId);
    }
};