const apiService = require('./apiService');

exports.getLoggedUser = (user) => {
    let eppn = user.eppn.split('@')[0];
    let hyGroupCn = concatenateArray(user.hyGroupCn.split(";"));
    let preferredLanguage = user.preferredLanguage;

    return {
        eppn: eppn,
        hyGroupCn: hyGroupCn,
        preferredLanguage: preferredLanguage
    }
}

const concatenateArray = (data) => Array.prototype.concat.apply([], data);

exports.parseContributor = (paramArr) => {
    return paramArr.map(concatContributors);
}

const concatContributors = (value) => {
    return  `contributors:${value}`;
}