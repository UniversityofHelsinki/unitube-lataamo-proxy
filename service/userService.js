const utf8 = require('utf8');
const constants = require('../utils/constants');
const logger = require('../config/winstonLogger');

exports.getLoggedUser = (user) => {
    let eppn = utf8.decode(user.eppn.split('@')[0]);
    let hyGroupCn = concatenateArray(utf8.decode(user.hyGroupCn).split(';'));
    let preferredLanguage = utf8.decode(user.preferredLanguage);
    let displayName = utf8.decode(user.displayName);
    return {
        eppn: eppn,
        hyGroupCn: hyGroupCn,
        preferredLanguage: preferredLanguage,
        displayName: displayName
    };
};

exports.isAuthorizedToTranslation = (user) => {
    let hyGroupCn = concatenateArray(utf8.decode(user.hyGroupCn).split(';'));
    let group = hyGroupCn.find(group => group === constants.TRANSLATION_GROUP_NAME);
    return group ? true : false;
};

exports.userHasPermissions = (requestUser, contributors, title) => {
    const user = exports.getLoggedUser(requestUser);
    if (user && contributors && title) {
        const isNotInboxSeries = !title.toLowerCase().includes(constants.INBOX);
        const userInContributors = contributors.includes(user.eppn);
        const iamGroupInContributors = user.hyGroupCn && user.hyGroupCn.some(
            iamGroup =>
                contributors.includes(iamGroup)
        );
        return (userInContributors || iamGroupInContributors) && isNotInboxSeries;
    }
    return false;
};

const concatenateArray = (data) => Array.prototype.concat.apply([], data);

exports.parseContributor = (paramArr) => {
    return paramArr.map(concatContributors);
};

const concatContributors = (value) => {
    return  `contributors:${value}`;
};

exports.logoutUser = (req, res, url) => {
    try {
        req.logout();
        if (req.cookies) {
            Object.keys(req.cookies).forEach(cookie => {
                if (!cookie.includes(constants.SHIBBOLETH_COOKIE_NAME)) {
                    res.clearCookie(cookie);
                }
            });
        }
    } catch (error) {
        logger.error(`Error in logging out user ${error}`);
    }
    res.redirect(url);
};
