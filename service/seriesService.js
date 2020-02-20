const commonService = require('../service/commonService');
const constants = require('../utils/constants');
const apiService = require('../service/apiService');

exports.getUserSeries = (series, user) => filterSeriesByUser(series, user);

exports.getSeriesIdentifiers = (series, user) => {
    const userSeries = filterSeriesByUser(series, user);
    const seriesIdentifiers = getSeriesIdentifiers(userSeries);
    return seriesIdentifiers;
};

const filteredUserAttributes = (user) => {
    let filteredAttributes = [];
    filteredAttributes.push(user.eppn);
    filteredAttributes.push(user.hyGroupCn);
    filteredAttributes = concatenateArray(filteredAttributes);
    return filteredAttributes;
};

const filterSeriesByUser = (series, user) => {
    const filteredAttributes = filteredUserAttributes(user);
    const filteredSeriesByUser = series.filter(serie => {
        return serie.contributors.some(contributor => filteredAttributes.includes(contributor));
    });
    return filteredSeriesByUser;
};

const getSeriesIdentifiers = (filteredSeriesByUser) => {
    return filteredSeriesByUser.map(serie => serie.identifier);
};

exports.getSeriesFromEventMetadata = (metadata) => {
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
        return field.id === id ? field.value = value : '';
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


exports.addUserToEmptyContributorsList = (metadata, user) => {
    !metadata.contributors || metadata.contributors.length === 0 ? metadata.contributors = [user.eppn] : metadata.contributors;
};

exports.filterInboxSeries = (series, user) => series.filter(series => series.title.toLowerCase() !== constants.INBOX + ' ' + user.eppn);

exports.filterTrashSeries = (series) => series.filter(series => !series.title.toLowerCase().includes(constants.TRASH));

exports.openCastFormatSeriesMetadata = (metadata, user) => {
    let seriesMetadataTemplate = constants.SERIES_METADATA;
    updateSeriesEntryById(seriesMetadataTemplate, 'title', metadata.title);
    updateSeriesEntryById(seriesMetadataTemplate, 'description', metadata.description);
    exports.addUserToEmptyContributorsList(metadata, user);
    addUserInContributorsList(metadata.contributors, user);
    updateSeriesContributorsList(seriesMetadataTemplate, metadata.contributors);
    return seriesMetadataTemplate;
};

const updateAclTemplateReadEntry = (seriesACLTemplateReadEntry, aclRole) => {
    return {
        ...seriesACLTemplateReadEntry,
        role: aclRole
    };
};

const updateAclTemplateWriteEntry = (seriesACLTemplateWriteEntry, aclRole) => {
    return {
        ...seriesACLTemplateWriteEntry,
        role: aclRole
    };
};

const isMoodleAclRole = aclRole => aclRole.includes(constants.MOODLE_ACL_INSTRUCTOR) || aclRole.includes(constants.MOODLE_ACL_LEARNER);
const publicRole = publicRole => publicRole.includes(constants.ROLE_ANONYMOUS) || publicRole.includes(constants.ROLE_KATSOMO);

const updateSeriesAclList = (aclList) => {

    let seriesAclTemplate = [];
    if (process.env.ENVIRONMENT === 'prod') {
        seriesAclTemplate = [...constants.SERIES_ACL_TEMPLATE_TUOTANTO];
    } else {
        seriesAclTemplate = [...constants.SERIES_ACL_TEMPLATE];
        aclList = commonService.removeRoleWhenTestEnvironment(aclList, constants.ROLE_KATSOMO_TUOTANTO);
    }
    let seriesACLTemplateReadEntry = constants.SERIES_ACL_TEMPLATE_READ_ENTRY;
    let seriesACLTemplateWriteEntry = constants.SERIES_ACL_TEMPLATE_WRITE_ENTRY;
    let public_series = false;
    if (aclList) {
        aclList.forEach(aclRole => {
            seriesACLTemplateReadEntry = updateAclTemplateReadEntry(seriesACLTemplateReadEntry, aclRole);
            seriesACLTemplateWriteEntry = updateAclTemplateWriteEntry(seriesACLTemplateWriteEntry, aclRole);
            seriesAclTemplate.push(seriesACLTemplateReadEntry);
            if (!publicRole(aclRole) && !isMoodleAclRole(aclRole)) {
                seriesAclTemplate.push(seriesACLTemplateWriteEntry);
            }
            if (publicRole(aclRole)) {
                public_series = true;
            }
        });
    }
    if (process.env.ENVIRONMENT !== 'prod' && public_series) { //if  public series
        seriesAclTemplate = seriesAclTemplate.concat([...constants.SERIES_ACL_TEMPLATE_TEST]);
    }
    return seriesAclTemplate;
};

exports.openCastFormatSeriesAclList = (metadata) => updateSeriesAclList(metadata.acl);

const concatenateArray = (data) => Array.prototype.concat.apply([], data);

const getSeriesRolesLists = async (series) => {
    return Promise.all(series.map(async series => {
        let roles = await apiService.getSeriesAcldata(series.identifier);
        return {
            ...series,
            roles: roles
        };
    }));
};

const updateSeriesPublicity = (series) => {
    let published = false;
    if (commonService.publicRoleCount(series.roles) >= 1) { //series has both (constants.ROLE_ANONYMOUS, constants.ROLE_KATSOMO) roles
        published = true;
    } else {
        published = false;
    }
    return {
        ...series,
        published : published
    };
};

// Looping array of series elements
//
// Adds published value in series array for each series:
//   if user has ROLE_ANONYMOUS and ROLE_KATSOMO --> published is true otherwise false
exports.addPublicityStatusToSeries = async (seriesList) => {
    let seriesWithRoles = await getSeriesRolesLists(seriesList);
    let seriesWithRolesAndVisibility = [];
    if (seriesWithRoles) {
        seriesWithRoles.forEach(series => {
            seriesWithRoles = updateSeriesPublicity(series);
            seriesWithRoles = calculateVisibilityProperty(seriesWithRoles);
            seriesWithRolesAndVisibility.push(seriesWithRoles);
        });
    }
    return seriesWithRolesAndVisibility;
};

exports.addPublishedInfoInSeriesAndMoodleRoles = async (series) => {
    let roles = await apiService.getSeriesAcldata(series.identifier);
    if (commonService.publicRoleCount(roles) >= 1) { //series has both (constants.ROLE_ANONYMOUS, constants.ROLE_KATSOMO) roles
        series.published = constants.ROLE_ANONYMOUS;
    } else {
        series.published = '';
    }
    series.moodleNumber = '';
    series.moodleNumbers = moodleNumbersFromRoles(roles);
    return series;
};

let instructor = new RegExp(constants.MOODLE_ACL_INSTRUCTOR, 'g');
let learner = new RegExp(constants.MOODLE_ACL_LEARNER, 'g');

const moodleNumbersFromRoles = (roles) => {
    let moodlenumbers = [];
    for (const item of roles) {
        if (item.role.match(instructor) || item.role.match(learner)) {
            let ind = item.role.indexOf('_');
            let val = item.role.substring(0, ind);
            moodlenumbers.push(val);
        }
    }
    const uniqueMoodleNumbers = Array.from(new Set(moodlenumbers));

    return uniqueMoodleNumbers;
};

const calculateVisibilityProperty = (series) => {
    return {
        ...series,
        visibility: calculateVisibilityPropertyForSeries(series)
    };
};

const setVisibilityForSeries = (series) => {
    const visibility = [];

    if (commonService.publicRoleCount(series.roles) >= 1) { //video has both (constants.ROLE_ANONYMOUS, constants.ROLE_KATSOMO) roles
        visibility.push(constants.STATUS_PUBLISHED);
    } else {
        visibility.push(constants.STATUS_PRIVATE);
    }

    const moodleAclInstructor = series.roles.filter(role => role.role.includes(constants.MOODLE_ACL_INSTRUCTOR));
    const moodleAclLearner = series.roles.filter(role => role.role.includes(constants.MOODLE_ACL_LEARNER));

    if (moodleAclInstructor && moodleAclLearner && moodleAclInstructor.length > 0 && moodleAclLearner.length > 0) {
        visibility.push(constants.STATUS_MOODLE);
    }
    return [...new Set(visibility)];
};

const calculateVisibilityPropertyForSeries = (series) => setVisibilityForSeries(series);

exports.getSeriesIdentifier = (series) => series.find(series => series.identifier).identifier;