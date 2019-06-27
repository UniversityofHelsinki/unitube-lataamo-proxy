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
    const foundFieldWithSeriesInfo = metadata.fields.find(field => {
        return field.id === 'isPartOf';
    });

    console.log("found: " + JSON.stringify(foundFieldWithSeriesInfo));
    return foundFieldWithSeriesInfo;
};
