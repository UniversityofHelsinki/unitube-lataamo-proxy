const chai = require('chai');
const expect = chai.expect;
const SeriesService = require('../../service/seriesService');
const constants = require('../../utils/constants');

describe('Series Service', function() {
    it('updateSeriesAcl() should return admin roles if no items are passed in', function() {
        let aclList = SeriesService.openCastFormatSeriesAclList([]);
        expect(aclList.length).to.equal(4);
        expect(aclList).to.deep.equal(constants.SERIES_ACL_TEMPLATE);
    });
});