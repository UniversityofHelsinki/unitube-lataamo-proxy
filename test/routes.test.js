
const chai = require('chai');           // https://www.npmjs.com/package/chai
const assert = chai.assert;
const supertest = require('supertest'); // https://www.npmjs.com/package/supertest
const app = require('../app')

let test = require('./testHelper');


// Unitube-lataamo proxy APIs under the test
const LATAAMO_USER_SERIES_PATH = '/api/userSeries';
const LATAAMO_USER_EVENTS_PATH = '/api/userEvents';
const LATAAMO_API_INFO_PATH = '/api/';
const LATAAMO_USER_PATH = '/api/user';


describe('Authentication with shibboleth headers (eppn, preferredlanguage, hyGroupCn)', () => {

  it("should return 200 OK when eppn and preferredlanguage are present", async () => {
    let response = await supertest(app)
        .get(LATAAMO_API_INFO_PATH)
        .set('eppn', 'test_request_id')
        .set('preferredlanguage', 'test_lang')
        .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
        .expect(200)
        .expect('Content-Type', /json/)
  });

  it("should return 401 OK when eppn header not present", async () => {
    let response = await supertest(app)
        .get(LATAAMO_API_INFO_PATH)
        .set('preferredlanguage', 'test_lang')
        .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
        .expect(401)
  });

  it("should return 401 OK when preferredlanguage header not present", async () => {
    let response = await supertest(app)
        .get(LATAAMO_API_INFO_PATH)
        .set('eppn', 'test_request_id')
        .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
        .expect(401)
  });

  it("should return 401 OK when preferredlanguage and eppn headers not present", async () => {
    let response = await supertest(app)
        .get(LATAAMO_API_INFO_PATH)
        .expect(401)
  });

  it("should return 401 OK when hyGroupCn header is not present", async () => {
    let response = await supertest(app)
        .get(LATAAMO_API_INFO_PATH)
        .set('eppn', 'test_request_id')
        .set('preferredlanguage', 'test_lang')
        .expect(401)
  });

});


describe('api info returned from / route', () => {

  it("should return api info", async () => {
    let response = await supertest(app)
        .get(LATAAMO_API_INFO_PATH)
        .set('eppn', 'test_request_id')
        .set('preferredlanguage', 'test_lang')
        .set('hyGroupCn', 'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
        .expect(200)
        .expect('Content-Type', /json/)

    assert.equal(response.body.message, 'API alive');
    assert.isNotNull(response.body.name);
    assert.isNotNull(response.body.version);
  });
});


describe('user eppn and preferredlanguage returned from /user route', () => {

  it("should return user", async () => {
    let response = await supertest(app)
        .get(LATAAMO_USER_PATH)
        .set('eppn', test.mockTestUser.eppn)
        .set('preferredlanguage', test.mockTestUser.preferredlanguage)
        .set('hyGroupCn', test.mockTestUser.hyGroupCn)
        .expect(200)
        .expect('Content-Type', /json/)

    assert.equal(response.body.eppn, test.mockTestUser.eppn);
    assert.equal(response.body.preferredLanguage, test.mockTestUser.preferredlanguage);
  });
});


describe('user series returned from /userSeries route', () => {

  beforeEach(() => {
    // mock needed opencast apis
    test.mockOCastSeriesApiCall()
    test.mockOCastUserApiCall()
  })

  it("should return no series if user not the series contributor", async () => {
    let response = await supertest(app)
        .get(LATAAMO_USER_SERIES_PATH)
        .set('eppn', test.mockTestUser.eppn)
        .set('preferredlanguage', test.mockTestUser.preferredlanguage)
        .set('hyGroupCn', test.mockTestUser.hyGroupCn)
        .expect(200)
        .expect('Content-Type', /json/)

    assert.isArray(response.body, 'Response should be an array');
    assert.lengthOf(response.body, 0, 'Response array should be empty, no series should be returned');
  });


  it("should return user's series if user is the series contributor", async () => {
    let response = await supertest(app)
        .get(LATAAMO_USER_SERIES_PATH)
        .set('eppn', 'SeriesOwnerEppn')
        .set('preferredlanguage', test.mockTestUser.preferredlanguage)
        .set('hyGroupCn', test.mockTestUser.hyGroupCn)
        .expect(200)
        .expect('Content-Type', /json/)

    assert.isArray(response.body, 'Response should be an array');
    assert.lengthOf(response.body, 2, 'Two series should be returned');
  });

  afterEach(() => {
    test.cleanAll();
  })
});


describe('user events (videos) returned from /userEvents route', () => {
  beforeEach(() => {
    // mock needed opencast api calls
    test.mockOCastSeriesApiCall()
    test.mockOCastUserApiCall()
    test.mockOCastEvents_1_ApiCall()
    test.mockOCastEvents_2_ApiCall()
    test.mockOCastEventMetadata_1Call()
    test.mockOCastEventMetadata_2Call()
    test.mockOCastEventMetadata_3Call()
    test.mockOCastEvent1MediaCall()
    test.mockOCastEvent2MediaCall()
    test.mockOCastEvent3MediaCall()
    test.mockOCastEvent1MediaMetadataCall()
    test.mockOCastEvent2MediaMetadataCall()
    test.mockOCastEvent3MediaMetadataCall()
    test.mockOCastEvent1AclCall()
  })

  it("should return events from series where user is contributor", async () => {
    // see testHelper.js for the ids
    const TEST_EVENT_1_ID = '6394a9b7-3c06-477e-841a-70862eb07bfb';
    const TEST_EVENT_2_ID = '1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4';
    const TEST_EVENT_3_ID = '23af4ad3-6726-4f3d-bf21-c02b34753c32';

    let response = await supertest(app)
        .get(LATAAMO_USER_EVENTS_PATH)
        .set('eppn', 'SeriesOwnerEppn')
        .set('preferredlanguage', test.mockTestUser.preferredlanguage)
        .set('hyGroupCn', test.mockTestUser.hyGroupCn)
        .expect(200)
        .expect('Content-Type', /json/);

    assert.isArray(response.body, 'Response should be an array');
    assert.lengthOf(response.body, 3, 'Three events should be returned');
    assert.equal(response.body[0].identifier, TEST_EVENT_1_ID);
    assert.equal(response.body[1].identifier, TEST_EVENT_2_ID);
    assert.equal(response.body[2].identifier, TEST_EVENT_3_ID);
  });


  it("no events should be returned if user is not contributor in any series", async () => {
    const userId = 'NOT_CONTRIBUTOR_IN_ANY_SERIES'

    let response = await supertest(app)
        .get(LATAAMO_USER_EVENTS_PATH)
        .set('eppn', userId)
        .set('preferredlanguage', test.mockTestUser.preferredlanguage)
        .set('hyGroupCn', test.mockTestUser.hyGroupCn)
        .expect(200)
        .expect('Content-Type', /json/);

    assert.isArray(response.body, 'Response should be an array');
    assert.equal(response.body.length, 0);
  });


  afterEach(() => {
    test.cleanAll();
  })

});
