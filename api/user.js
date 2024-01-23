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

exports.isAuthorizedToTranslation = (req, res) => {
    try {
        logger.info(`GET /user/isAuthorizedToTranslation USER: ${req.user.eppn}`);
        res.json(userService.isAuthorizedToTranslation(req.user));
    } catch(err) {
        const msg = err.message;
        logger.error(`Error GET /user/isAuthorizedToTranslation ${msg} USER ${req.user.eppn}`);
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_USER,
            msg
        });
    }
};

exports.logout = (req, res) => {
    logger.info(`GET /logout USER: ${req.user.eppn} redirect url: ${req.query.return}` );
    const action = req.query.action;
    const redirectUrl = req.query.return;
    if (action === 'logout') {
        res.json(userService.logoutUser(req, res, redirectUrl));
    }
};
