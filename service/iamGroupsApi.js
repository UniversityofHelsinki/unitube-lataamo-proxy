const constants = require('../utils/constants');
const security = require('../config/security');

exports.getIamGroups = async (query) => {
    const iamGroupsApiPath = constants.ESB_IAM_GROUPS_PATH + encodeURI(query);
    const response = await security.esbGroupsBase.get(iamGroupsApiPath);
    return sortByValue(response.data);
};

const sortByValue = (iamGroups) => iamGroups.sort((a, b) => a.grpName.localeCompare(b.grpName));