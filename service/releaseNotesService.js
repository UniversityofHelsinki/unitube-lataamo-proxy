const {GITLAB_PATH} = require('../utils/constants');
const security = require('../config/security');
exports.getReleaseNotes = async () => {
    const response = await security.gitlabBase.get(GITLAB_PATH);
    if (response.status === 200) {
        return response.data;
    }
};
