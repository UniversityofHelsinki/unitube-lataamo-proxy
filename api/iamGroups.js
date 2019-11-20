'use strict';
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');
const iamGroupsApi = require('../service/iamGroupsApi');

exports.getIamGroups = async (req, res) => {
    try {
        logger.info(`GET /iamGroups/:query ${req.params.query}`);
        const iamGroups = await iamGroupsApi.getIamGroups(req.params.query);
        res.json(iamGroups);
    } catch (error) {
        const msg = error.message;
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_IAM_GROUPS,
            msg
        });
    }
};