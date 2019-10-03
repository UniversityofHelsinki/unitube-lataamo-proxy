const constants = require('../utils/constants');
const security = require('../config/security');

exports.getPersons = async (query) => {
    try {
        const personsPath = constants.ESB_PERSONS_PATH + encodeURI(query);
        const response = await security.esbPersonBase.get(personsPath);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};