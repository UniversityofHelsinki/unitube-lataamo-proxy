const constants = require('../utils/constants');
const security = require('../config/security');

exports.getPersons = async (query) => {
    const personsPath = constants.ESB_PERSONS_PATH + encodeURI(query);
    const response = await security.esbPersonBase.get(personsPath);
    return sortByLastName(response.data);
};

const sortByLastName = (persons) => persons.sort((a, b) => a.lastName.localeCompare(b.lastName));