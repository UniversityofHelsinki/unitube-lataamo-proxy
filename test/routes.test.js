
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


describe('user series returned from /userSeries route', () => {

  const mockTestUser = { 
    eppn: 'Tester-XYZ',
    preferredlanguage: 'fi'
  }

  const mockApiUser =  { 
    provider: 'opencast',
    name: 'Opencast Project Administrator',
    userrole: 'ROLE_USER_ADMIN',
    email: 'admin@localhost',
    username: 'admin' 
  }

  // these are filtered by contributor (eppn in contributor values)
  const mockUserSeries = [ 
    { identifier: '80f9ff5b-4163-48b7-b7cf-950be665de3c',
      creator: 'Opencast Project Administrator',
      created: '2019-06-11T12:59:40Z',
      subjects: 
        [ 'subjects-järvi',
          'subjects-laavu',
          'subjects-aamupuuro',
          'subjects-turve',
          'subjects-salama',
          'subjects-koivikko' ],
      organizers: [ 'creator-kasitunnus' ],
      publishers: [ 'publisher-kasitunnus' ],
      contributors: [ 'contrib1', 'jaaki' ],
      title: 'title-LATAAMO-131' 
    },
    { identifier: 'd72a8c9e-f854-4ba4-9ed2-89405fae214e',
      creator: 'Opencast Project Administrator',
      created: '2019-05-22T09:56:43Z',
      subjects: [ 'juusto', 'makasiini', 'aamupuuro', 'turve', 'salama', 'sämpylä' ],
      organizers: [ 'organizer1' ],
      publishers: [ '' ],
      contributors: [ 'SeriesOwnerEppn', 'Tester A', 'Tester B' ],
      title: 'kuutamossa' 
    }
  ]
  
  beforeEach(() => {  
    // mock needed opencast apis 
    nock(OCAST_BASE_URL)
      .get(OCAST_SERIES_PATH)
      .query({filter: 'Creator:Opencast Project Administrator'})
      .reply(200, mockUserSeries);

    nock(OCAST_BASE_URL)  
      .get(OCAST_USER_PATH)
      .reply(200, mockApiUser);
  })

  it("should return no series if user not the series contributor", async () => {
    let response = await supertest(app)
      .get(LATAAMO_USER_SERIES_PATH)
      .set('eppn', mockTestUser.eppn)
      .set('preferredlanguage', mockTestUser.preferredlanguage)
      .expect(200)
      .expect('Content-Type', /json/)

    assert.isArray(response.body, 'Response should be an array');
    assert.lengthOf(response.body, 0, 'Response array should be empty, no series should be returned');
  });


  it("should return user's series if user is the series contributor", async () => {
    let response = await supertest(app)
      .get(LATAAMO_USER_SERIES_PATH)
      .set('eppn', 'SeriesOwnerEppn')
      .set('preferredlanguage', mockTestUser.preferredlanguage)
      .expect(200)
      .expect('Content-Type', /json/)

    assert.isArray(response.body, 'Response should be an array');
    assert.lengthOf(response.body, 1, 'Response array should not be empty, 1 series should be returned');
  });

  afterEach(() => {
    // remove mocks
    nock.cleanAll();
  })
});
