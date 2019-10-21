const chai = require('chai');
const expect = chai.expect;
const SeriesService = require('../../service/seriesService');
const constants = require('../../utils/constants');

describe('Series Service', function() {
    it('updateSeriesAclList() should return admin roles if no items are passed in', function() {
        let aclList = SeriesService.openCastFormatSeriesAclList([]);
        expect(aclList.length).to.equal(4);
        expect(aclList).to.deep.equal(constants.SERIES_ACL_TEMPLATE);
    });

    it('updateSeriesAclList() should return admin roles with role_anonymous if role_anonymous is passed', function() {
        const seriesAclListWithRoleAnonymous = {"acl": ['ROLE_ANONYMOUS']};
        let aclList = SeriesService.openCastFormatSeriesAclList(seriesAclListWithRoleAnonymous);
        expect(aclList.length).to.equal(5);
        let expectedAclList = [...constants.SERIES_ACL_TEMPLATE, { allow: true, action: 'read', role: constants.ROLE_ANONYMOUS }];
        expect(aclList).to.deep.equal(expectedAclList);
    });

});