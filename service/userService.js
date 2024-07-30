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

exports.userHasPermissions = (requestUser, rawContributors) => {
    const user = exports.getLoggedUser(requestUser);
    const userGroups = user.hyGroupCn && user.hyGroupCn.filter(group => group);
    const contributors = rawContributors.reduce(
      (a, c) => a.concat(c.split(',')), []
    ).filter(c => c);
    if (user && contributors) {
        const userInContributors = contributors.includes(user.eppn);
        const iamGroupInContributors = contributors.some(contributor => 
          userGroups.includes(contributor)
        );
        return (userInContributors || iamGroupInContributors);
    }
    return false;
};

const concatenateArray = (data) => Array.prototype.concat.apply([], data);

exports.parseContributor = (paramArr) => {
    return paramArr.some(el => el !== '') ? paramArr.map(concatContributors) : undefined;
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
