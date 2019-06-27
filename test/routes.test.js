
const chai = require('chai');           // https://www.npmjs.com/package/chai
const assert = chai.assert; 
const nock = require('nock');           // https://www.npmjs.com/package/nock
const supertest = require('supertest'); // https://www.npmjs.com/package/supertest
const app = require('../app')


// Opencast APIs
const OCAST_BASE_URL = 'http://localhost:8080';
const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';
const OCAST_USER_PATH = '/api/info/me';
const OCAST_VIDEO_PUBLICATION_PATH = '/publications';
const OCAST_EVENT_MEDIA_PATH_PREFIX = '/admin-ng/event/';
const OCAST_EVENT_MEDIA_PATH_SUFFIX = '/asset/media/media.json';
const OCAST_EVENT_MEDIA_FILE_METADATA = '/asset/media/';

const OCAST_SERIES_FILTER_CREATOR = '?filter=Creator:';
const OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER = '?filter=series:';

// Unitube-lataamo proxy APIs
const LATAAMO_USER_SERIES_PATH = '/api/userSeries';
const LATAAMO_API_INFO_PATH = '/api/';
const LATAAMO_USER_PATH = '/api/user';


describe('Authentication with shibboleth headers (eppn, preferredlanguage)', () => {

  it("should return 200 OK when eppn and preferredlanguage are present", async () => {
    let response = await supertest(app)
      .get(LATAAMO_API_INFO_PATH)
      .set('eppn', 'test_request_id')
      .set('preferredlanguage', 'test_lang')
      .expect(200)
      .expect('Content-Type', /json/)
  });

  it("should return 401 OK when eppn header not present", async () => {
    let response = await supertest(app)
      .get(LATAAMO_API_INFO_PATH)
      .set('preferredlanguage', 'test_lang')
      .expect(401)
  });

  it("should return 401 OK when preferredlanguage header not present", async () => {
    let response = await supertest(app)
      .get(LATAAMO_API_INFO_PATH)
      .set('eppn', 'test_request_id')
      .expect(401)
  });

  it("should return 401 OK when preferredlanguage and eppn headers not present", async () => {
    let response = await supertest(app)
      .get(LATAAMO_API_INFO_PATH)
      .expect(401)
  });

});


describe('api info returned from / route', () => {

  it("should return api info", async () => {
    let response = await supertest(app)
      .get(LATAAMO_API_INFO_PATH)
      .set('eppn', 'test_request_id')
      .set('preferredlanguage', 'test_lang')
      .expect(200)
      .expect('Content-Type', /json/)

    assert.equal(response.body.message, 'API alive');
    assert.isNotNull(response.body.name);
    assert.isNotNull(response.body.version);
  });
});


describe('user eppn and preferredlanguage returned from /user route', () => {

  const mockTestUser = { 
    eppn: 'Tester-XYZ',
    preferredlanguage: 'fi'
  }

  it("should return user", async () => {
    let response = await supertest(app)
      .get(LATAAMO_USER_PATH)
      .set('eppn', mockTestUser.eppn)
      .set('preferredlanguage', mockTestUser.preferredlanguage)
      .expect(200)
      .expect('Content-Type', /json/)
  
    assert.equal(response.body.eppn, mockTestUser.eppn);
    assert.equal(response.body.preferredLanguage, mockTestUser.preferredlanguage);
  });
});


// TODO
describe.skip('user series returned from /userSeries route', () => {

  const mockTestUser = { 
    eppn: 'Tester-XYZ',
    preferredlanguage: 'fi'
  }
  
  before(() => {  
    // mock needed opencast apis 
    nock(OCAST_BASE_URL)
      .get(OCAST_SERIES_PATH)
      .query({filter: 'Creator:undefined'})
      .reply(200, mockTestUser);

    nock(OCAST_BASE_URL)
      .get(OCAST_USER_PATH)
      .reply(200, mockTestUser);
  })

  it("should return series", async () => {
    let response = await supertest(app)
      .get(LATAAMO_USER_SERIES_PATH)
      .set('eppn', mockTestUser.eppn)
      .set('preferredlanguage', mockTestUser.preferredlanguage)
      .expect(200)
      .expect('Content-Type', /json/)
    
    
    assert.equal(response.body.eppn, mockTestUser.eppn);
    assert.equal(response.body.preferredlanguage, mockTestUser.preferredlanguage);
  });

  after(() => {
    // remove mocks
    nock.cleanAll();
  })
});
