'use strict';
const logger = require('../config/winstonLogger');
const messageKeys = require('../utils/message-keys');
const personApiService = require('../service/personApiService');

exports.getPersons = async (req, res) => {
    try {
        logger.info(`GET /persons/:query ${req.params.query}`);
        const persons = await personApiService.getPersons(req.params.query);
        res.json(persons);
    } catch (error) {
        const msg = error.message;
        res.status(500);
        res.json({
            message: messageKeys.ERROR_MESSAGE_FAILED_TO_GET_PERSONS,
            msg
        });
    }
};