
// returns title for user's series,
// uses same naming convention with salitallenninj√§rjestelm√§
exports.seriesTitleForLoggedUser = (seriesName, userId) => {
    return  seriesName + ` ${userId}`;
};
