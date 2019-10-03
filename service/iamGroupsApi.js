const constants = require('../utils/constants');
const security = require('../config/security');

exports.getIamGroups = async (query) => {
    try {
        const iamGroupsApiPath = constants.ESB_IAM_GROUPS_PATH + query;
        const response = await security.esbGroupsBase.get(iamGroupsApiPath);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};