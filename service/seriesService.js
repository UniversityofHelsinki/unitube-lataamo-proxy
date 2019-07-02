exports.getUserSeries = (series, user) =>  filterSeriesByUser(series, user);

exports.getSeriesIdentifiers = (series, user) =>  {
    const userSeries = filterSeriesByUser(series, user);
    const seriesIdentifiers = getSeriesIdentifiers(userSeries);
    return seriesIdentifiers;
}

const filterSeriesByUser = (series, user) => {
    let filteredAttributes = [];
    filteredAttributes.push(user.eppn);
    filteredAttributes.push(user.hyGroupCn);
    filteredAttributes = concatenateArray(filteredAttributes);
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

const concatenateArray = (data) => Array.prototype.concat.apply([], data);
