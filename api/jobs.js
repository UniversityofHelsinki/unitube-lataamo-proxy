const jobService = require('../service/jobsService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');
const HttpStatus = require('http-status');

exports.getJobStatus =  (req, res) => {
    try {
        logger.info(`GET /monitor/:jobId ${req.params.jobId}`);
        const job = jobService.getJob(req.params.jobId);
        if (job.status === constants.JOB_STATUS_STARTED) {
            res.status(HttpStatus.ACCEPTED);
        }
        if (job.status === constants.JOB_STATUS_FINISHED) {
            res.status(HttpStatus.CREATED)
        }
        if (job.status === constants.JOB_STATUS_ERROR) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR);
        }
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