
// returns title for user's series,
// uses same naming convention with salitallenninjärjestelmä
exports.seriesTitleForLoggedUser = (seriesName, userId) => {
    return  seriesName + ` ${userId}`;
};
