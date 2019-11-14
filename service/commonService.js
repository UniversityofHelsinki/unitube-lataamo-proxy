const constants = require('../utils/constants');

/**
 * Calculates count of public roles, ROLE_ANONYMOUS and ROLE_KATSOMO
 *
 * @param roles
 * @returns {number}
 */
exports.publicRoleCount = (roles) => {
    let countPublicRoles = 0; //count of public roles ROLE_ANONYMOUS and ROLE_KATSOMO
                              //both of the roles has only READ rights (so they appear only once in roles list) so
                              //countPublicRoles value 2 means that series/video is published
    if (roles) {
        roles.forEach(item => {
            const match = constants.PUBLIC_ROLES.filter(entry => item.role.includes(entry));
            if (match && match.length > 0) {
                ++countPublicRoles;
            }
        })
    }
    return countPublicRoles;
}
/*

exports.getAcl = (aclList, acl) => {
    return aclList.map(elem => {
        if (elem === acl) {
            console.log('elem:', elem)
            return elem;
        }
        return null;
    })
}
===============================================================
Jotain tällasta tohon ylle: tää on SeriesDetailsForm.js sivulta
===============================================================
try {
    await actionUpdateSerieDetails(seriesId, updatedSeries);
    setSuccessMessage('JUST A PLACE HOLDER TEXT');
    // update the serieslist to redux state
    props.onSerieDetailsEdit(props.series.map(
        series => series.identifier !== seriesId ? series : updatedSeries));
} catch (err) {
    setErrorMessage('JUST A PLACE HOLDER TEXT');
}*/
