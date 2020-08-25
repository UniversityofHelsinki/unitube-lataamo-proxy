const jobService = require('../service/jobsService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');
const constants = require('../utils/constants');
const HttpStatus = require('http-status');

exports.getJobStatus = async (req, res) => {
    try {
        const job = await jobService.getJob(req.params.jobId);
        const parsedJob = JSON.parse(job);

        if (parsedJob && parsedJob.status) {
            if (parsedJob.status === constants.JOB_STATUS_STARTED) {
                res.status(HttpStatus.ACCEPTED);
            }
            if (parsedJob.status === constants.JOB_STATUS_FINISHED) {
                await jobService.removeJob(req.params.jobId);
                logger.info(`[Jobs] Job removed with JOB_ID: ${parsedJob.jobId} USER: ${req.user.eppn}`);
                res.status(HttpStatus.CREATED);
            }
            if (parsedJob.status === constants.JOB_STATUS_ERROR) {
                await jobService.removeJob(req.params.jobId);
                logger.info(`[Jobs] Job removed after ERROR. JOB_ID: ${parsedJob.jobId} USER: ${req.user.eppn}`);
                res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            res.json(parsedJob);
        } else {
            logger.error(`[Jobs] Failed to get status for job from jobService. JOB: ${job} USER: ${req.user.eppn}`);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR);
            res.json({
                message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_JOB
            });
        }
    } catch (error) {
        const msg = error.message;
        logger.error(`[Jobs] Failed to get job. JOB_ID: ${req.params.jobId} ERROR: ${error} USER: ${req.user.eppn}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_JOB,
            msg
        });
    }
};
