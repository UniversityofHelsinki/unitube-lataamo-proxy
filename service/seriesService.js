exports.getSeriesIdentifiers = (series, user) =>  {
    const filteredSerieIdentifiersByUser = filterSerieIdentifiersByUser(series, user);
    const seriesIdentifiers = getSeriesIdentifiers(filteredSerieIdentifiersByUser);
    return seriesIdentifiers;
}

const filterSerieIdentifiersByUser = (series, user) => {
    const filteredSeriesByUser = series.filter(serie => {
        return serie.organizers.some(organizer => {
             return organizer === user
        });
    });
    return filteredSeriesByUser;
}

const getSeriesIdentifiers = (filteredSeriesByUser) => {
    return filteredSeriesByUser.map(serie => serie.identifier);
}
