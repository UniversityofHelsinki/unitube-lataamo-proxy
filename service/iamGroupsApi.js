const constants = require('../utils/constants');
const security = require('../config/security');

exports.getIamGroups = async (query) => {
    try {
        const iamGroupsApiPath = constants.ESB_IAM_GROUPS_PATH + query;
        console.log(iamGroupsApiPath);
        const response = await security.esbBase.get(iamGroupsApiPath);
        return response.data;
    } catch (e) {
        console.log(e);
    }
};