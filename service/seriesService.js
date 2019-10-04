const constants = require('../utils/constants');
const apiService = require('../service/apiService');

exports.getUserSeries = (series, user) => filterSeriesByUser(series, user);

exports.getSeriesIdentifiers = (series, user) => {
    const userSeries = filterSeriesByUser(series, user);
    const seriesIdentifiers = getSeriesIdentifiers(userSeries);
    return seriesIdentifiers;
}

const filteredUserAttributes = (user) => {
    let filteredAttributes = [];
    filteredAttributes.push(user.eppn);
    filteredAttributes.push(user.hyGroupCn);
    filteredAttributes = concatenateArray(filteredAttributes);
    return filteredAttributes;
}

const filterSeriesByUser = (series, user) => {
    const filteredAttributes = filteredUserAttributes(user);
    const filteredSeriesByUser = series.filter(serie => {
        return serie.contributors.some(contributor => filteredAttributes.includes(contributor));
    });
    return filteredSeriesByUser;
}

const getSeriesIdentifiers = (filteredSeriesByUser) => {
    return filteredSeriesByUser.map(serie => serie.identifier);
}

exports.getSerieFromEventMetadata = (metadata) => {
    const foundEpisodeFlavorMetadata = metadata.find(field => {
        return field.flavor === 'dublincore/episode';
    });
    const foundFieldWithSeriesInfo = foundEpisodeFlavorMetadata.fields.find(field => {
        return field.id === 'isPartOf';
    });
    return foundFieldWithSeriesInfo;
};

const updateSeriesEntryById = (seriesMetadataTemplate, id, value) => {
    return seriesMetadataTemplate[0].fields.filter(field => {
        return field.id === id ? field.value = value : ''
    });
};

const updateSeriesContributorsList = (seriesMetadataTemplate, contributors) => {
    const seriesContributors = constants.SERIES_CONTRIBUTORS_TEMPLATE;
    seriesContributors.value = contributors;
    return seriesMetadataTemplate[0].fields.push(seriesContributors);
};

const addUserInContributorsList = (contributors, user) => {
    const foundOwner = contributors.find(contributor => {
        return contributor === user.eppn;
    });
    if (!foundOwner) {
        contributors.push(user.eppn);
    }
};


const addUserToEmptyContributorsList = (metadata, user) => {
    !metadata.contributors ? metadata.contributors = [user.eppn] : metadata.contributors;
}

exports.openCastFormatSeriesMetadata = (metadata, user) => {
    let seriesMetadataTemplate = constants.SERIES_METADATA;
    updateSeriesEntryById(seriesMetadataTemplate, "title", metadata.title);
    updateSeriesEntryById(seriesMetadataTemplate, "description", metadata.description);
    addUserToEmptyContributorsList(metadata, user);
    addUserInContributorsList(metadata.contributors, user);
    updateSeriesContributorsList(seriesMetadataTemplate, metadata.contributors);
    return seriesMetadataTemplate;
};

const updateAclTemplateReadEntry = (seriesACLTemplateReadEntry, aclRole) => {
    return {
        ...seriesACLTemplateReadEntry,
        role: aclRole
    }
};

const updateAclTemplateWriteEntry = (seriesACLTemplateWriteEntry, aclRole) => {
    return {
        ...seriesACLTemplateWriteEntry,
        role: aclRole
    }
};

const updateSeriesAclList = (aclList, operation) => {
    let seriesAclTemplate = [...constants.SERIES_ACL_TEMPLATE];
    let seriesACLTemplateReadEntry = constants.SERIES_ACL_TEMPLATE_READ_ENTRY;
    let seriesACLTemplateWriteEntry = constants.SERIES_ACL_TEMPLATE_WRITE_ENTRY;
    if (aclList) {
        aclList.forEach(aclRole => {
            seriesACLTemplateReadEntry = updateAclTemplateReadEntry(seriesACLTemplateReadEntry, aclRole);
            seriesACLTemplateWriteEntry = updateAclTemplateWriteEntry(seriesACLTemplateWriteEntry, aclRole);
            seriesAclTemplate.push(seriesACLTemplateReadEntry);
        });
    }
    return seriesAclTemplate;
};

exports.openCastFormatSeriesAclList = (metadata, operation) => updateSeriesAclList(metadata.acl, operation);

const concatenateArray = (data) => Array.prototype.concat.apply([], data);

// Looping array of series elements
//
// Adds published value in series array for each series:
//   if user has ROLE_ANONYMOUS --> published is true otherwise false
exports.addPublishedInfoInSeries = async (seriesList) => {

    let seriesListWithPublished = [];
    for (const series of seriesList) {
        let roles = await apiService.getSeriesAcldata(series.identifier);
        if (roles && roles.find((item) => item.role === constants.ROLE_ANONYMOUS)) {
            series.published = true;
            seriesListWithPublished.push(series);
        } else {
            series.published = false;
            seriesListWithPublished.push(series);
        }
    }
    return seriesListWithPublished;
}

exports.addPublishedInfoInSeriesAndMoodleRoles = async (series) => {

    let roles = await apiService.getSeriesAcldata(series.identifier);
    if (roles && roles.find((item) => item.role === constants.ROLE_ANONYMOUS)) {
        series.published = constants.ROLE_ANONYMOUS;
    } else {
        series.published = "";
    }
    series.moodleNumber = "";
    series.moodleNumbers = moodleNumbersFromRoles(roles);
    return series;
}

let instructor = new RegExp(constants.MOODLE_ACL_INSTRUCTOR, 'g');
let learner = new RegExp(constants.MOODLE_ACL_LEARNER, 'g');

const moodleNumbersFromRoles = (roles) => {

    let moodlenumbers = [];
    for (const item of roles) {
        if (item.role.match(instructor) || item.role.match(learner)) {
            let ind = item.role.indexOf("_");
            let val = item.role.substring(0, ind);
            moodlenumbers.push(val);
        }
    }
    const uniqueMoodleNumbers = Array.from(new Set(moodlenumbers));

    return uniqueMoodleNumbers;
}