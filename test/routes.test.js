
const chai = require('chai');           // https://www.npmjs.com/package/chai
const assert = chai.assert;
const expect = chai.expect;
const supertest = require('supertest'); // https://www.npmjs.com/package/supertest
const app = require('../app');

let test = require('./testHelper');


// Unitube-lataamo proxy APIs under the test
const LATAAMO_USER_SERIES_PATH = '/api/userSeries';
const LATAAMO_USER_EVENTS_PATH = '/api/userVideos';
const LATAAMO_USER_EVENT_PATH = '/api/event';
const LATAAMO_SERIES_PATH = '/api/series';
const LATAAMO_API_INFO_PATH = '/api/';
const LATAAMO_USER_PATH = '/api/user';
const LATAAMO_API_VIDEO_PATH = '/api/videoUrl/';

const constants = require('../utils/constants');

describe('Authentication with shibboleth headers (eppn, preferredlanguage, hyGroupCn)', () => {

    it("should return 200 OK when eppn and preferredlanguage are present", async () => {
        let response = await supertest(app)
            .get(LATAAMO_API_INFO_PATH)
            .set('eppn', 'test_request_id')
            .set('preferredlanguage', 'test_lang')
            .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
            .set('displayName', 'Matti Meikalainen')
            .expect(200)
            .expect('Content-Type', /json/)
    });

    it("should return 401 OK when eppn header not present", async () => {
        let response = await supertest(app)
            .get(LATAAMO_API_INFO_PATH)
            .set('preferredlanguage', 'test_lang')
            .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
            .set('displayName', 'Matti Meikalainen')
            .expect(401)
    });

    it("should return 200 OK when preferredlanguage header not present", async () => {
        let response = await supertest(app)
            .get(LATAAMO_API_INFO_PATH)
            .set('eppn', 'test_request_id')
            .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
            .set('displayName', 'Matti Meikalainen')
            .expect(200)
    });

    it("should return 401 OK when preferredlanguage and eppn headers not present", async () => {
        let response = await supertest(app)
            .get(LATAAMO_API_INFO_PATH)
            .expect(401)
    });

    it("should return 200 OK when hyGroupCn header is not present", async () => {
        let response = await supertest(app)
            .get(LATAAMO_API_INFO_PATH)
            .set('eppn', 'test_request_id')
            .set('preferredlanguage', 'test_lang')
            .set('displayName', 'Matti Meikalainen')
            .expect(200)
    });
});


describe('api info returned from / route', () => {

    it("should return api info", async () => {
        let response = await supertest(app)
            .get(LATAAMO_API_INFO_PATH)
            .set('eppn', 'test_request_id')
            .set('preferredlanguage', 'test_lang')
            .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
            .set('displayName', 'Matti Meikalainen')
            .expect(200)
            .expect('Content-Type', /json/);

        assert.equal(response.body.message, 'API alive');
        assert.isNotNull(response.body.name);
        assert.isNotNull(response.body.version);
    });
});


describe('user eppn, preferredlanguage and hyGroupCn returned from /user route', () => {

    it("should return user", async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_PATH)
            .set('eppn', test.mockTestUser.eppn)
            .set('preferredLanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.equal(response.body.eppn, test.mockTestUser.eppn);
        assert.equal(response.body.preferredLanguage, test.mockTestUser.preferredlanguage);
        assert.equal(response.body.hyGroupCn, test.mockTestUser.hyGroupCn);
    });
});


describe('user series returned from /userSeries route', () => {

    beforeEach(() => {
        // mock needed opencast apis
        test.mockOCastSeriesApiCallEmpty();
        test.mockOCastSeriesApiCall2();
        test.mockOCastUserApiCall();
        test.mockOCastSeriesApiCall();
        test.mockOCastEvent1AclCall();
        test.mockOcastEvent2AclCall();
    });

    it("should return no series if user and users groups are not in the series contributors list", async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_SERIES_PATH)
            .set('eppn', test.mockTestUser.eppn)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 0, 'Response array should be empty, no series should be returned');
    });


    it("should return user's series if user is the series contributor", async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_SERIES_PATH)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 2, 'Two series should be returned');
    });

    it("should return user's series if users group is in the series contributors list", async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_SERIES_PATH)
            .set('eppn', test.mockTestUser.eppn)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 1, 'One series should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_SERIES_1_ID);
    });

    afterEach(() => {
        test.cleanAll();
    });
});

describe('user series returned from /userSeries route', () => {

    beforeEach(() => {
        // mock needed opencast apis
        test.mockOCastSeriesApiCall6();
        test.mockOCastEvent1AclCall();
        test.mockOcastEvent2AclCall();
        test.mockOcastEvent3AclCall();
    });

    it("should return user's series published == true for the first and second series and published == false for the third series", async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_SERIES_PATH)
            .set('eppn', test.mockTestUser2.eppn)
            .set('preferredlanguage', test.mockTestUser2.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser2.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.equal(response.body[0].published, true, 'Response should be an array');
        assert.equal(response.body[1].published, true, 'Two series should be returned');
        assert.equal(response.body[2].published, false, 'Two series should be returned');
    });

    afterEach(() => {
        test.cleanAll();
    });
});

describe('user series person - and iamgroup administrators returned from /series route', () => {

    beforeEach(() => {
        // mock needed opencast apis
        test.mockOCastSeriesApiCall7();
        test.mockOCastEvent1AclCall();
    });

    it("should return user's series with three iamgroups and three persons ", async () => {
        let response = await supertest(app)
            .get(LATAAMO_SERIES_PATH + '/123456')
            .set('eppn', test.mockTestUser2.eppn)
            .set('preferredlanguage', test.mockTestUser2.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser2.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.lengthOf(response.body.persons, 3, 'Three person administrators should be returned');
        assert.lengthOf(response.body.iamgroups, 3, 'Three group administrators should be returned');
    });

    afterEach(() => {
        test.cleanAll();
    });
});

describe('user video urls returned from /video/id events route', () => {
  beforeEach(() => {
    // mock needed opencast api calls
    test.mockEventPublicationCall();
    test.mockEvent2PubcliationCall();
  });

  it("should return highest quality video url", async () => {
    let response = await supertest(app)
        .get(LATAAMO_API_VIDEO_PATH + test.constants.TEST_EVENT_1_ID)
        .set('eppn', 'SeriesOwnerEppn')
        .set('preferredlanguage', test.mockTestUser.preferredlanguage)
        .set('hyGroupCn', test.mockTestUser.hyGroupCn)
        .set('displayName', test.mockTestUser.displayName)
        .expect(200)
        .expect('Content-Type', /json/);

    assert.isArray(response.body, 'Response should be an array');
    assert.lengthOf(response.body, 1, 'One video should be returned');
    assert.equal(response.body[0].url, 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/a9f5e413-1dcc-4832-a750-251a16893b2f/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo.mp4');
  });

  it('should return two highest quality videos', async () =>  {
    let response = await supertest(app)
        .get(LATAAMO_API_VIDEO_PATH + test.constants.TEST_EVENT_2_ID)
        .set('eppn', 'SeriesOwnerEppn')
        .set('preferredlanguage', test.mockTestUser.preferredlanguage)
        .set('hyGroupCn', test.mockTestUser.hyGroupCn)
        .set('displayName', test.mockTestUser.displayName)
        .expect(200)
        .expect('Content-Type', /json/);

    assert.isArray(response.body, 'Response should be an array');
    assert.lengthOf(response.body, 2, 'Two videos should be returned');
    assert.equal(response.body[0].url, 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/a4227095-2b28-4846-b538-a0c8129d54b8/SHOT4_4K_CC_injected.mp4');
    assert.equal(response.body[1].url, 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/e11d592c-f67c-423c-a275-fb4d39868510/SHOT4_4K_CC_injected.mp4');
  });

  afterEach(() => {
    test.cleanAll();
  });
});


describe('user series put', () => {

    beforeEach(() => {
        // mock needed opencast api calls
        test.mockLataamoPutSeriesCall();
        test.mockLataamoUpdateSeriesAcl();
        test.mockLataamoUpdateSeriesMetadata();
    });

    it("Successful series update should return 200", async () => {
        const userId = 'NOT_CONTRIBUTOR_IN_ANY_SERIES';
        let response = await supertest(app)
            .put(LATAAMO_SERIES_PATH + '/123456')
            .send({identifier: '123456', title: 'Sarja1', description: 'sarjan on hyvä'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.equal(response.status, "200");
    });
});

describe('user events (videos) returned from /userEvents route', () => {
  beforeEach(() => {
    // mock needed opencast api calls
    test.mockOCastSeriesApiCall();
    test.mockOCastSeriesApiCall3();
    test.mockOCastSeriesApiCall4();
    test.mockOCastSeriesApiCall5();
    test.mockOCastSeriesApiCall9();
    test.mockOCastSeriesApiCall10();
    test.mockOCastUserApiCall();
    test.mockOCastEvents_1_ApiCall();
    test.mockOCastEvents_2_ApiCall();
    test.mockOCastEventMetadata_1Call();
    test.mockOCastEventMetadata_2Call();
    test.mockOCastEventMetadata_3Call();
    test.mockOCastEvent1MediaCall();
    test.mockOCastEvent2MediaCall();
    test.mockOCastEvent3MediaCall();
    test.mockOCastEvent1MediaMetadataCall();
    test.mockOCastEvent2MediaMetadataCall();
    test.mockOCastEvent3MediaMetadataCall();
    test.mockOCastEvent1AclCall();
    test.mockOcastEvent2AclCall();
    test.mockLataamoPostSeriesCall();
  });

    it("should return events from series where user is contributor", async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 3, 'Three events should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_EVENT_1_ID);
        assert.equal(response.body[1].identifier, test.constants.TEST_EVENT_2_ID);
        assert.equal(response.body[2].identifier, test.constants.TEST_EVENT_3_ID);
        assert.isArray(response.body[0].visibility, "Video's visibility property should be an array");
        assert.isArray(response.body[1].visibility, "Video's visibility property should be an array");
        assert.isArray(response.body[2].visibility, "Video's visibility property should be an array");
        assert.lengthOf(response.body[0].visibility, 1, 'Video should have one visibility value');
        assert.equal(response.body[0].visibility, constants.STATUS_PUBLISHED);
        assert.lengthOf(response.body[1].visibility, 1, 'Video should have one visibility value');
        assert.equal(response.body[1].visibility, constants.STATUS_PUBLISHED);
        assert.lengthOf(response.body[2].visibility, 2, 'Video should have two visibility values');
        assert.deepEqual(response.body[2].visibility, [constants.STATUS_PUBLISHED, constants.STATUS_MOODLE]);
    });

    it("events should have visibility array property", async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body[0].visibility, "Video's visibility property should be an array");
        assert.isArray(response.body[1].visibility, "Video's visibility property should be an array");
        assert.isArray(response.body[2].visibility, "Video's visibility property should be an array");
    });


    it("should return events from series where users group is in contributors field", async () => {
        const userId = 'NOT_CONTRIBUTOR_IN_ANY_SERIES';
        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 2, 'Two events should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_EVENT_1_ID);
        assert.equal(response.body[1].identifier, test.constants.TEST_EVENT_2_ID);
    });


    it("no events should be returned from series where users group is not in contributors field", async () => {
        const userId = 'NOT_CONTRIBUTOR_IN_ANY_SERIES';
        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3')
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.equal(response.body.length, 0);
    });


    it("no events should be returned if user is not contributor in any series", async () => {
        const userId = 'NOT_CONTRIBUTOR_IN_ANY_SERIES';

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.equal(response.body.length, 0);
    });
});

afterEach(() => {
    test.cleanAll();
});

describe('user series post', () => {

    beforeEach(() => {
        // mock needed opencast api calls
        test.mockLataamoPostSeriesCall();
        test.mockOCastSeriesApiCall8();
    });

    it("Successful series update should return 200 and identifier", async () => {
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'Hieno sarja', description: 'hienon sarjan kuvaus'})
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.equal(response.body, test.constants.SUCCESSFUL_UPDATE_ID);
    });

    it("Unsuccessful series update should return 403", async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'inbox SeriesOwnerEppn', description: 'Inbox sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, '"inbox" not allowed in series title. Series was not created.');
    });

    it('"inbox" string not allowed in series\' title', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'inbox in the title', description: 'Inbox sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, '"inbox" not allowed in series title. Series was not created.');
    });

    it('"INBOX" string not allowed in series\' title', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'INBOX in the title', description: 'Inbox sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, '"inbox" not allowed in series title. Series was not created.');
    });

    it('"InBoX" string not allowed in series\' title', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'InBoX in the title', description: 'Inbox sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, '"inbox" not allowed in series title. Series was not created.');
    });
});


describe('Updating videos aka events', () => {

    it('Should fail if the event has an active transaction on opencast', async () => {
        test.mockOpencastEventActiveTransaction('234234234');

        let response = await supertest(app)
            .put(LATAAMO_USER_EVENTS_PATH + '/234234234')
            .send({title: 'Hieno', description: 'Hienon kuvaus', identifier: '234234234'}) // id from req body!
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, 'Transaction active for given event');
    });

    it('Should fail if update event metadata request returns something else than 204 from opencast', async () => {
        test.mockOpencastEventNoActiveTransaction('234234234');
        test.mockOpencastUpdateEventNOK('234234234');

        await supertest(app)
            .put(LATAAMO_USER_EVENTS_PATH + '/234234234')
            .send({title: 'Hieno', description: 'Hienon kuvaus', identifier: '234234234'}) // id from req body!
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(400)
            .expect('Content-Type', /json/);
    });


    it('Should fail if GET mediapackage request returns something else than 200 from opencast', async () => {
        test.mockOpencastEventNoActiveTransaction('234234234');
        test.mockOpencastUpdateEventOK('234234234');
        test.mockOpencastFailedMediaPackageRequest('234234234');

        let response = await supertest(app)
            .put(LATAAMO_USER_EVENTS_PATH + '/234234234')
            .send({title: 'Hieno', description: 'Hienon kuvaus', identifier: '234234234'}) // id from req body!
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(400)
            .expect('Content-Type', /json/);
    });

    it('Should fail if republish metadata request returns something else than 204 from opencast', async () => {
        test.mockOpencastEventNoActiveTransaction('234234234');
        test.mockOpencastUpdateEventOK('234234234');
        test.mockOpencastMediaPackageRequest('234234234');
        test.mockOpencastFailedRepublishMetadataRequest('234234234');

        await supertest(app)
            .put(LATAAMO_USER_EVENTS_PATH + '/234234234')
            .send({title: 'Hieno', description: 'Hienon kuvaus', identifier: '234234234'}) // id from req body!
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(400)
            .expect('Content-Type', /json/);
    });

    it('Should update event if all OK', async () => {
        test.mockOpencastEventNoActiveTransaction('234234234');
        test.mockOpencastUpdateEventOK('234234234');
        test.mockOpencastMediaPackageRequest('234234234');
        test.mockOpencastRepublishMetadataRequest('234234234');

        await supertest(app)
            .put(LATAAMO_USER_EVENTS_PATH + '/234234234')
            .send({title: 'Hieno', description: 'Hienon kuvaus', identifier: '234234234'}) // id from req body!
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);
    });
});

afterEach(() => {
    test.cleanAll();
});

describe('Fetching event from /event/id route', () => {

    beforeEach(() => {
        test.mockOCastEventMetadata_1Call();
        test.mockOpencastEvent1Request();
        test.mockOCastSeriesApiCall();
        test.mockOCastUserApiCall();
        test.mockOCastEvents_1_ApiCall();
        test.mockOCastEventMetadata_1Call();
        test.mockOCastEvent1MediaCall();
        test.mockOCastEvent1MediaMetadataCall();
        test.mockOCastEvent1AclCall();
        test.mockLataamoPostSeriesCall();
    });

    it('GET /event/:id', async () => {

        const expectedAcls = [ { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
            { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
            { allow: true, role: 'ROLE_ADMIN', action: 'read' },
            { allow: true, role: 'ROLE_ADMIN', action: 'write' },
            { allow: true, role: 'ROLE_ANONYMOUS', action: 'read' } ];

        const licenses = [ 'ALLRIGHTS',
            'CC-BY',
            'CC-BY-SA',
            'CC-BY-ND',
            'CC-BY-NC',
            'CC-BY-NC-SA',
            'CC-BY-NC-ND',
            'CC0' ];

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENT_PATH + '/' + test.constants.TEST_EVENT_1_ID)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .expect(200)
            .expect('Content-Type', /json/)
        assert.equal(response.body.identifier, test.constants.TEST_EVENT_1_ID);
        assert.equal(response.body.description, 'TEMPORARY DESCRIPTION, PLEASE UPDATE');
        assert.equal(response.body.creator, 'Lataamo Api User');
        assert.equal(response.body.title, 'testivideo.mov');
        assert.equal(response.body.processing_state, 'SUCCEEDED');
        assert.equal(response.body.isPartOf, test.constants.TEST_SERIES_1_ID);
        expect(response.body.visibility).to.deep.equal(['status_published']);
        assert.equal(response.body.media[0].mimetype, 'video/mp4');
        assert.equal(response.body.media[0].id, '638b7ae1-0710-44df-b3db-55ee9e8b48ba');
        assert.equal(response.body.media[0].type, 'presenter/source');
        assert.equal(response.body.media[0].url, 'http://opencast:8080/assets/assets/6394a9b7-3c06-477e-841a-70862eb07bfb/638b7ae1-0710-44df-b3db-55ee9e8b48ba/7/fruits_on_table.mp4');
        assert.equal(response.body.mediaFileMetadata.duration, 14721);
        assert.equal(response.body.mediaFileMetadata.size, 38321839);
        assert.equal(response.body.mediaFileMetadata.checksum, 'bcdcde376469378a034c2e0dad33e497');
        assert.equal(response.body.mediaFileMetadata.id, '638b7ae1-0710-44df-b3db-55ee9e8b48ba');
        assert.equal(response.body.mediaFileMetadata.type, 'presenter/source');
        expect(response.body.acls).to.deep.equal(expectedAcls);
        expect(response.body.licenses).to.deep.equal(licenses);
        assert.equal(response.body.license, 'ALLRIGHTS');
    });


    it('GET /event/:id with undefined id should return 500 with error message', async () => {

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENT_PATH + '/' + '234234324')
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .expect(500)
            .expect('Content-Type', /json/)
        assert.equal(response.body.message, 'error_failed_to_get_event');
    });
});



