const jobService = require('../service/jobsService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');

exports.getJobStatus =  (req, res) => {
    try {
        logger.info(`GET /monitor/:jobId ${req.params.jobId}`);
        const job = jobService.getJob(req.params.jobId);
        res.json(job);
    } catch (error) {
        const msg = error.message;
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_JOB,
            msg
        });
    }
};