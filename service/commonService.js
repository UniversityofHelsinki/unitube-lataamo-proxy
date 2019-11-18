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
        this.addGivenRoleWhenTestEnvironment(roles, constants.ROLE_ANONYMOUS);
        roles.forEach(item => {
            const match = constants.PUBLIC_ROLES.filter(entry => item.role.includes(entry));
            if (match && match.length > 0) {
                ++countPublicRoles;
            }
        })
    }
    return countPublicRoles;
}

/**
 * if NOT prod environment and has roleToCompare role (=ROLE_ANONYMOUS)
 *  - adds ROLE_KATSOMO role in roles if roles don't already have ROLE_KATSOMO role
 *
 * @param roleList
 * @param roleToCompare
 */
exports.addGivenRoleWhenTestEnvironment = (roleList, roleToCompare) => {

    if (roleList && process.env.ENVIRONMENT !== 'prod') {
        let found = false;
        let alreadyInRoleList = false;

        if (process.env.ENVIRONMENT !== 'prod') {
            roleList.map(elem => {
                if (elem.role === roleToCompare) {
                    found = true;
                }
                if (elem.role === constants.ROLE_KATSOMO) {
                    alreadyInRoleList = true;
                }
            })
            if (!alreadyInRoleList && found) {
                roleList.push(constants.SERIES_ACL_ROLE_KATSOMO);
            }
        }
    }
}

/**
 * if NOT prod environment
 *  - removes ROLE_KATSOMO role in roles
 *
 * @param roleList
 * @param roleToRemove
 * @returns {[]}
 */
exports.removeRoleWhenTestEnvironment = (roleList, roleToRemove) => {
    let newRoles = [];

    if (roleList && process.env.ENVIRONMENT !== 'prod') {
        roleList.map(role => {
            role === roleToRemove ? role : newRoles.push(role)
        })
    }
    return newRoles;
}

