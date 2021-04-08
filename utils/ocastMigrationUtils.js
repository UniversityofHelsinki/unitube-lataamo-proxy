/**
 * Helpers for Opencast version update changes
 *
 * Opencast version 5 -> 6
 *   - split contributors if multiple found in one string value
 *
 */



const MIGRATION_ACTIVE = true; // whether or not to use the tools

/***
 * Checks contributors attribute from given list of series.
 * Splits contributors to separate contributor entries in contributor list when needed.
 *
 * Example 1
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu, jummi'
 * Output:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu', 'jummi'
 *
 *
 * Example 2
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 * Output:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 *
 *
 * Example 3
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'grp-best_group_of_all, molly, grp-not_so_best', 'gavin'
 * Output:
 *    contributors : 'grp-best_group_of_all', 'molly', 'grp-not_so_best', 'gavin'
 *
 *
 *
 * @param userSeries one series
 * @returns series with modified contributors
 */
exports.splitContributorsFromSeries = (userSeries) => {
    let hackedSeries;

    if (!MIGRATION_ACTIVE) {
        return userSeries;
    }

    try {
        if (userSeries) {
            let resolvedContributors = [];
            for (const contributor of userSeries.contributors){
                if(contributor.includes(',')){
                    // split and trim and concat to existing contributors
                    resolvedContributors =
                        resolvedContributors.concat(contributor.split(',').map(s => s.trim()));
                }else{
                    resolvedContributors.push(contributor);
                }
            }
            let uniqueContributors = [...new Set(resolvedContributors)];
            userSeries.contributors = uniqueContributors;
            hackedSeries = userSeries;
        } else {
            console.log('ERROR splitContributorsFromSeries: userSeries was undefined');
            return {};
        }
    } catch (e) {
        console.log('ERROR splitContributorsFromSeries', e);
        throw Error('Failed to resolve contributors');
    }
    return hackedSeries;
}

/***
 * Checks contributors attribute from given list of series.
 * Splits contributors to separate contributor entries in contributor list when needed.
 *
 * Example 1
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu, jummi'
 * Output:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu', 'jummi'
 *
 *
 * Example 2
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 * Output:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 *
 *
 * Example 3
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'grp-best_group_of_all, molly, grp-not_so_best', 'gavin'
 * Output:
 *    contributors : 'grp-best_group_of_all', 'molly', 'grp-not_so_best', 'gavin'
 *
 *
 *
 * @param userSeries List of series
 * @returns {[]} list of series
 */
exports.splitContributorsFromSeriesList = (listOfSeries) => {
    const hackedSeries = [];

    if (!MIGRATION_ACTIVE) {
        return listOfSeries;
    }

    try {
        if (listOfSeries && Array.isArray(listOfSeries)) {
            for (const series of listOfSeries) {
                let resolvedContributors = [];
                for (const contributor of series.contributors){
                    if(contributor.includes(',')){
                        resolvedContributors =
                            // split and trim and concat to existing contributors
                            resolvedContributors.concat(contributor.split(',').map(s => s.trim()));
                    }else{
                        resolvedContributors.push(contributor);
                    }
                }
                series.contributors = resolvedContributors;
                hackedSeries.push(series);
            }
        } else {
            console.log('ERROR splitContributorsFromSeriesList: listOfSeries was no array');
            return [];
        }
    } catch (e) {
        console.log('ERROR splitContributorsFromSeriesList', e);
        throw Error('Failed to resolve contributors');
    }

    return hackedSeries;
}
