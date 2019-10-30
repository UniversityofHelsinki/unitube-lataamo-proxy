const chai = require('chai');
const expect = chai.expect;
const SeriesService = require('../../service/seriesService');
const constants = require('../../utils/constants');

describe('Series Service', function() {
    it('updateSeriesAclList() should return admin roles if no items are passed in', function() {
        let aclList = SeriesService.openCastFormatSeriesAclList([]);
        expect(aclList.length).to.equal(2);
        expect(aclList).to.deep.equal(constants.SERIES_ACL_TEMPLATE);
    });

    it('updateSeriesAclList() should return correct roles if role_anonymous is selected', function() {
        const seriesAclListWithRoleAnonymous = {"acl": ['ROLE_ANONYMOUS']};
        let aclList = SeriesService.openCastFormatSeriesAclList(seriesAclListWithRoleAnonymous);
        expect(aclList.length).to.equal(3);
        const aclReadEntry = { allow: true, action: 'read', role: constants.ROLE_ANONYMOUS };
        let expectedAclList = [...constants.SERIES_ACL_TEMPLATE, aclReadEntry];
        expect(aclList).to.deep.equal(expectedAclList);
    });

    it('updateSeriesAclList() should return correct roles if role_anonymous and moodle roles are selected', function() {
        const seriesAclListWithRoleAnonymous = {"acl": ['ROLE_ANONYMOUS', "123_Instructor", "123_Learner"]};
        let aclList = SeriesService.openCastFormatSeriesAclList(seriesAclListWithRoleAnonymous);
        expect(aclList.length).to.equal(5);
        let aclRoleAnonymousReadEntry = { allow: true, action: 'read', role: constants.ROLE_ANONYMOUS };
        let aclRoleInstructorMoodleReadEntry = { allow: true, action: 'read', role: '123' + constants.MOODLE_ACL_INSTRUCTOR };
        let aclRoleMoodleLearnerReadEntry = { allow: true, action: 'read', role: '123' + constants.MOODLE_ACL_LEARNER };
        let expectedAclList = [...constants.SERIES_ACL_TEMPLATE, aclRoleAnonymousReadEntry, aclRoleInstructorMoodleReadEntry, aclRoleMoodleLearnerReadEntry];
        expect(aclList).to.deep.equal(expectedAclList);
    });


    it('updateSeriesAclList() should return correct roles if role_katsomo and moodle roles are selected', function() {
        const seriesAclListWithRoleAnonymous = {"acl": ['ROLE_KATSOMO', "123_Instructor", "123_Learner"]};
        let aclList = SeriesService.openCastFormatSeriesAclList(seriesAclListWithRoleAnonymous);
        expect(aclList.length).to.equal(7);
        let aclRoleAnonymousReadEntry = { allow: true, action: 'read', role: constants.ROLE_KATSOMO };
        let aclRoleInstructorMoodleReadEntry = { allow: true, action: 'read', role: '123' + constants.MOODLE_ACL_INSTRUCTOR };
        let aclRoleMoodleLearnerReadEntry = { allow: true, action: 'read', role: '123' + constants.MOODLE_ACL_LEARNER };
        let expectedAclList = [...constants.SERIES_ACL_TEMPLATE, aclRoleAnonymousReadEntry, aclRoleInstructorMoodleReadEntry, aclRoleMoodleLearnerReadEntry];
        expect(aclList).to.deep.equal(expectedAclList);
    });

});