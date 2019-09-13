const constants = require('../utils/constants');

exports.getUserSeries = (series, user) =>  filterSeriesByUser(series, user);

exports.getSeriesIdentifiers = (series, user) =>  {
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
        return serie.contributors.some(contributor=> filteredAttributes.includes(contributor));
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

const updateSeriesContributorsList = (seriesMetadataTemplate, id, value) => {
    const seriesContributors = constants.SERIES_CONTRIBUTORS_TEMPLATE;
    seriesContributors.value = value;
    return seriesMetadataTemplate[0].fields.push(seriesContributors);
}

exports.openCastFormatSeriesMetadata = (metadata) => {
    let seriesMetadataTemplate = constants.SERIES_METADATA;
    updateSeriesEntryById(seriesMetadataTemplate, "title", metadata.title);
    updateSeriesEntryById(seriesMetadataTemplate, "description", metadata.description);
    updateSeriesContributorsList(seriesMetadataTemplate, "contributor", metadata.contributors);
    return seriesMetadataTemplate;
};

exports.openCastFormatSeriesAclList = (alcs) => {
    // todo genarate acl array based on series acl selection
    let seriesAclTemplate = constants.SERIES_ACL_TEMPLATE;
    return seriesAclTemplate;
}



const concatenateArray = (data) => Array.prototype.concat.apply([], data);
