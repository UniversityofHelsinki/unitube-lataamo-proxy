const apiService = require('./apiService');

exports.getLoggedUser = (user) => {
    let eppn = user.eppn.split('@')[0];
    let hyGroupCn = concatenateArray(user.hyGroupCn.split(";"));
    return {
        eppn: eppn,
        hyGroupCn: hyGroupCn
    }
}

const concatenateArray = (data) => Array.prototype.concat.apply([], data);