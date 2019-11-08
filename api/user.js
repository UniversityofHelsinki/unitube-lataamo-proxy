'use strict';

const userService = require('../service/userService');
const messageKeys = require('../utils/message-keys');
const logger = require('../config/winstonLogger');

exports.userInfo = (req, res) => {
    try {
        logger.info(`GET /user USER: ${req.user.eppn}`);
        res.json(userService.getLoggedUser(req.user));
    } catch(err) {
        const msg = err.message;
        logger.error(`Error GET /user ${msg} USER ${req.user.eppn}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_USER,
            msg
        });
    }
};
