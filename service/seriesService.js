exports.getUserSeries = (series, user) =>  filterSeriesByUser(series, user);

exports.getSeriesIdentifiers = (series, user) =>  {
    const userSeries = filterSeriesByUser(series, user);
    const seriesIdentifiers = getSeriesIdentifiers(userSeries);
    return seriesIdentifiers;
}

const filterSeriesByUser = (series, user) => {
    const filteredSeriesByUser = series.filter(serie => {
        return serie.contributors.some(contributor => {
            return contributor === user
        });
    });
    return filteredSeriesByUser;
}

const getSeriesIdentifiers = (filteredSeriesByUser) => {
    return filteredSeriesByUser.map(serie => serie.identifier);
}

exports.getSerieFromEventMetadata = (metadata) => {
    console.log("metadata fields: ", metadata.fields);
    const foundFieldWithSeriesInfo = metadata.fields.find(field => {
        console.log("field id :" , field.id);
        return field.id === 'isPartOf';
    });
    return foundFieldWithSeriesInfo;
};