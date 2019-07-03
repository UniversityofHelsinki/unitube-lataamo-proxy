const apiService = require('./apiService');

exports.getApiUser = async () => await apiService.getUser();

exports.getLoggedUser = (user) => {
    let hyGroupCn = concatenateArray(user.hyGroupCn.split(";"));
    return {
        eppn: user.eppn,
        hyGroupCn: hyGroupCn
    }
}

const concatenateArray = (data) => Array.prototype.concat.apply([], data);