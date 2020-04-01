const jobService = require('../service/jobsService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');
const HttpStatus = require('http-status');

exports.getJobStatus =  (req, res) => {
    try {
        logger.info(`GET /monitor/:jobId ${req.params.jobId}`);
        const job = jobService.getJob(req.params.jobId);
        if (job && job.status) {
            if (job.status === constants.JOB_STATUS_STARTED) {
                res.status(HttpStatus.ACCEPTED);
            }
            if (job.status === constants.JOB_STATUS_FINISHED) {
                jobService.removeJob(req.params.jobId);
                res.status(HttpStatus.CREATED);
            }
            if (job.status === constants.JOB_STATUS_ERROR) {
                jobService.removeJob(req.params.jobId);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            res.json(job);
        } else {
            logger.error(`Error in getting job status job is ${job} and job status is ${job.status}`);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_JOB
            });
        }
    } catch (error) {
        const msg = error.message;
        logger.error(`Error in getting job: ${error} message : ${msg}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_JOB,
            msg
        });
    }
};