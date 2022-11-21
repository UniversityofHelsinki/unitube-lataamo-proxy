
const chai = require('chai');           // https://www.npmjs.com/package/chai
const assert = chai.assert;
const expect = chai.expect;
const supertest = require('supertest'); // https://www.npmjs.com/package/supertest
let app;

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let test = require('./testHelper');
const testXXX = require('./testHelperXXX');

// Unitube-lataamo proxy APIs under the test
const LATAAMO_USER_SERIES_PATH = '/api/userSeries';
const LATAAMO_USER_EVENTS_PATH = '/api/userVideos';
const LATAAMO_MOVE_EVENT_TO_TRASH_SERIES = '/api/moveEventToTrash';
const LATAAMO_USER_INBOX_EVENTS_PATH = '/api/userInboxEvents';
const LATAAMO_USER_TRASH_EVENTS_PATH = '/api/userTrashEvents';
const LATAAMO_USER_EVENT_PATH = '/api/event';
const LATAAMO_SERIES_PATH = '/api/series';
const LATAAMO_API_INFO_PATH = '/api/info';
const LATAAMO_USER_PATH = '/api/user';
const LATAAMO_API_VIDEO_PATH = '/api/videoUrl/';

const constants = require('../utils/constants');
const messageKeys = require('../utils/message-keys');
const Pool = require('pg-pool');
const client = require('../service/database');
const Constants = require("../utils/constants");

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

before('Mock db connection and load app', async () => {
    // Create a new pool with a connection limit of 1
    const pool = new Pool({
        user: process.env.POSTGRES_USER,
        host: process.env.HOST,
        database: process.env.DATABASE,
        password: process.env.PASSWORD,
        port: process.env.PORT,
        max: 1, // Reuse the connection to make sure we always hit the same temporal schema
        idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
        ssl: process.env.SSL ? true : false
    });

    // Mock the query function to always return a connection from the pool we just created
    client.query = (text, values) => {
        return pool.query(text, values);
    };

    // It's important to import the app after mocking the database connection
    app = require('../app');
});

beforeEach(async () => {
    await client.query('CREATE TEMPORARY TABLE videos (video_id VARCHAR(255) NOT NULL, archived_date date, actual_archived_date date, deletion_date date, informed_date date, video_creation_date date, first_notification_sent_at timestamp, second_notification_sent_at timestamp, third_notification_sent_at timestamp, skip_email boolean default false, PRIMARY KEY(video_id))');
});

afterEach('Drop temporary tables', async () => {
    await wait(10);
    await client.query('DROP TABLE pg_temp.videos');
});


describe('api info returned from /info route', () => {

    it('should return api info', async () => {
        let response = await supertest(app)
            .get(LATAAMO_API_INFO_PATH)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.equal(response.body.message, 'API alive');
        assert.isNotNull(response.body.name);
        assert.isNotNull(response.body.version);
    });
});


describe('user eppn, preferredlanguage and hyGroupCn returned from /user route', () => {

    it('should return user', async () => {
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

    it('should return 401 OK when eppn header not present', async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_PATH)
            .expect(401);
    });
});


describe('user series returned from /userSeries route', () => {

    beforeEach(() => {
        // mock needed opencast apis
        test.mockOCastSeriesApiCall2();
        test.mockOCastUserApiCall();
        test.mockOCastSeriesApiCall();
        test.mockOCastEvent1AclCall();
        test.mockOcastEvent2AclCall();
        test.mockOCastEvents_1_ApiCall();
        test.mockOCastEvents_2_ApiCall();
    });

    it('-Contributor FIX- Should return no series if user and users groups are not in the series contributors list', async () => {
        testXXX.mockOpencastSeriesApiEmptyResult_XXX();
        testXXX.mockOpencastSeriesApiEmptyResult_XXX_2();

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

    it('-Contributor FIX- Should return user\'s series if user is the series contributor', async () => {
        testXXX.mockUserSeriesListCall_elluri_XXX();
        const seriesOwnerEppn = 'elluri';

        let response = await supertest(app)
            .get(LATAAMO_USER_SERIES_PATH)
            .set('eppn', seriesOwnerEppn)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            //.set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.equal(response.body[0].eventsCount, 2);
        assert.lengthOf(response.body, 2, 'Two series should be returned');
        assert.equal(response.body[1].eventsCount, 1);
    });

    it('-Contributor FIX- Should return user\'s series if users group is in the series contributors list', async () => {
        testXXX.mockUserSeriesListCall_elluri_XXX2();
        testXXX.mockUserSeriesListCall_grp_oppuroomu_XXX();

        const groupOfTheUser = 'grp-oppuroomu';
        const seriesOwnerEppn = 'elluri';

        let response = await supertest(app)
            .get(LATAAMO_USER_SERIES_PATH)
            .set('eppn', seriesOwnerEppn)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', groupOfTheUser) //'grp-lataamo-2;grp-lataamo-3;grp-lataamo-1')
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 1, 'One series should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_SERIES_1_ID);
        assert.equal(response.body[0].eventsCount, 2);
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
        test.mockOCastEvents_1_ApiCall();
        test.mockOCastEvents_2_ApiCall();
        test.mockOcastEvetns_3_ApiCall();
    });

    it('-Contributor FIX- Should return user\'s series published == true for the first and second series and published == false for the third series', async () => {
        const eppen = 'Tester-XYZ';
        const gruppen = 'grp-lataamo-6';

        testXXX.mockOpencastSeriesApiResult3SeriesContributorParam_XXX(eppen);
        testXXX.mockOpencastSeriesApiResult3SeriesContributorParam_XXX(gruppen);

        let response = await supertest(app)
            .get(LATAAMO_USER_SERIES_PATH)
            .set('eppn', eppen)
            .set('preferredlanguage', test.mockTestUser2.preferredlanguage)
            .set('hyGroupCn', gruppen)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.equal(response.body[0].published, true, 'Response should be an array');
        assert.deepEqual(response.body[0].visibility, ['status_published']);
        assert.equal(response.body[0].eventsCount, 2);
        assert.equal(response.body[1].published, true, 'Two series should be returned');
        assert.deepEqual(response.body[1].visibility, ['status_published', 'status_moodle']);
        assert.equal(response.body[1].eventsCount, 1);
        assert.equal(response.body[2].published, false, 'Two series should be returned');
        assert.equal(response.body[2].eventsCount, 1);
        assert.deepEqual(response.body[2].visibility, ['status_private']);
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
        test.mockOCastEvents_1_ApiCall();
    });

    it('should return user\'s series with three iamgroups and three persons ', async () => {
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
        test.mockEventEpisodeCall();
        test.mockeEvent2EpisodeCall();
        test.mockEvent1VttFileCall();
        test.mockEvent2VttFileCall();
    });

    it('should return highest quality video url', async () => {
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

    it('should return highest quality video url with correct vtt file', async () => {
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
        assert.equal(response.body[0].vttFile.id, 'd74f0d42-5084-468d-b224-f2ec5f058492');
        assert.equal(response.body[0].vttFile.url, 'http://localhost:8080/static/mh_default_org/engage-player/2d72b653-02f6-4638-ba58-281b2d49af33/7578df20-9939-40dc-a305-7f83e225e9af/testwebvtt.vtt');
        assert.isNotNull(response.body[0].vttFile.track);
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
        assert.isNotNull(response.body[0].vttFile.track);
        assert.isNotNull(response.body[1].vttFile.track);
    });

    it('should return two highest quality videos with correct vtt files', async () =>  {
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
        assert.equal(response.body[0].vttFile.url, 'http://localhost:8080/static/mh_default_org/engage-player/2d72b653-02f6-4638-ba58-281b2d49af33/7578df20-9939-40dc-a305-7f83e225e9af/testwebvtt.vtt');
        assert.equal(response.body[1].vttFile.url, 'http://localhost:8080/static/mh_default_org/engage-player/2d72b653-02f6-4638-ba58-281b2d49af33/7578df20-9939-40dc-a305-7f83e225e9af/testwebvtt.vtt');
        assert.isNotNull(response.body[0].vttFile.track);
        assert.isNotNull(response.body[1].vttFile.track);
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
        test.noSeriesEventsCall();
    });

    it('Successful series update should return 200', async () => {
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

        assert.equal(response.status, '200');
    });
});

describe('user inbox events returned from /userInboxEvents route', () => {
    beforeEach(() => {
        // mock needed opencast api calls
        test.mockOpencastTrashSeriesRequest();
        test.mockOpencastInboxSeriesRequest();
        test.mockInboxSeriesEventsRequest();
        test.mockInboxSeriesEventsForListRequest();
        test.mockOpencastTrashSeriesWithNoResultRequest();
        test.mockOpencastInboxSeriesWithNoResultRequest();
        test.mockOcastInboxEvent1Call();
        test.mockOcastInboxEvent2Call();
        test.mockOCastEvent1InboxMediaMetadataCall();
        test.mockOCastEvent2InboxMediaMetadataCall();
        test.mockInboxEvent1MediaFileMetadataCall();
        test.mockInboxEvent2MediaFileMetadataCall();
        test.mockInboxSeriesAclCall();
        test.mockInboxSeriesCall();

        test.mockLataamoPostSeriesCall();
        test.mockLataamoPostSeriesCall();

    });

    it('should return inbox events from inbox series', async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_INBOX_EVENTS_PATH)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 2, 'Two events should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_INBOX_EVENT_1);
        assert.equal(response.body[0].creator, 'Opencast Project Administrator');
        assert.equal(response.body[0].processing_state, 'SUCCEEDED');
        assert.equal(response.body[0].title, 'INBOX EVENT 1');
        assert.equal(response.body[1].identifier, test.constants.TEST_INBOX_EVENT_2);
        assert.equal(response.body[1].title, 'INBOX EVENT 2');
        assert.equal(response.body[0].creator, 'Opencast Project Administrator');
        assert.equal(response.body[0].processing_state, 'SUCCEEDED');
        assert.deepEqual(response.body[0].visibility, ['status_private']);

        await wait(100);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(2);
        expect(rows[0].video_id).to.deep.equal(response.body[0].identifier);
        expect(rows[0].archived_date).to.not.be.null;
        expect(rows[1].video_id).to.deep.equal(response.body[1].identifier);
        expect(rows[1].archived_date).to.not.be.null;
    });


    it('should return null actual archived date for video which is returned to active state from videos table', async () => {
        await client.query('INSERT INTO videos (video_id, archived_date, video_creation_date, actual_archived_date) VALUES (11111, \'2018-01-01\'::date, \'2008-01-01\'::date, \'2017-01-01\'::date)');

        await supertest(app)
            .get(LATAAMO_USER_INBOX_EVENTS_PATH)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        await wait(100);

        const { rows } = await client.query('SELECT * FROM videos');

        expect(rows).lengthOf(2);

        expect(rows[0].video_id).to.deep.equal(test.constants.TEST_INBOX_EVENT_2);
        expect(rows[0].archived_date).to.not.be.null;
        expect(rows[0].actual_archived_date).to.be.null;
        expect(rows[1].video_id).to.deep.equal(test.constants.TEST_INBOX_EVENT_1);
        expect(rows[1].archived_date).to.not.be.null;
        expect(rows[1].actual_archived_date).to.be.null;
    });

    it('should return no inbox events from inbox series', async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_INBOX_EVENTS_PATH)
            .set('eppn', 'userWithNoInboxEvents')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 0, 'No events should be returned');

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(0);
    });
});

afterEach(() => {
    test.cleanAll();
});

describe('user trash events returned from /userTrashEvents route', () => {
    beforeEach(() => {
        // mock needed opencast api calls
        test.mockOpencastTrashSeriesRequest();
        test.mockOpencastTrashSeriesWithNoResultRequest();
        //test.mockTrashSeriesEventsRequest();
        test.mockTrashSeriesEventsForListRequest();
        test.mockOcastTrashEvent1Call();
        test.mockOcastTrashEvent2Call();
        test.mockOCastEvent1TrashMediaMetadataCall();
        test.mockOCastEvent2TrashMediaMetadataCall();
        test.mockTrashEvent1MediaFileMetadataCall();
        test.mockTrashEvent2MediaFileMetadataCall();
        test.mockTrashSeriesAclCall();
        test.mockTrashSeriesCall();
        //
        // test.mockLataamoPostSeriesCall();
        // test.mockLataamoPostSeriesCall();

    });

    it('should return trash events from trash series', async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_TRASH_EVENTS_PATH)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 2, 'Two events should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_TRASH_EVENT_1);
        assert.equal(response.body[0].creator, 'Opencast Project Administrator');
        assert.equal(response.body[0].processing_state, 'SUCCEEDED');
        assert.equal(response.body[0].title, 'TRASH EVENT 1');
        assert.equal(response.body[1].identifier, test.constants.TEST_TRASH_EVENT_2);
        assert.equal(response.body[1].title, 'TRASH EVENT 2');
        assert.equal(response.body[0].creator, 'Opencast Project Administrator');
        assert.equal(response.body[0].processing_state, 'SUCCEEDED');
        assert.deepEqual(response.body[0].visibility, ['status_private']);
    });

    it('should return no trash events from trash series', async () => {
        let response = await supertest(app)
            .get(LATAAMO_USER_TRASH_EVENTS_PATH)
            .set('eppn', 'userWithNoTrashEvents')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 0, 'No events should be returned');
    });
});

afterEach(() => {
    test.cleanAll();
});



describe('user events (videos) returned from /userEvents route', () => {
    beforeEach(() => {
        // mock needed opencast api calls
        test.mockOCastSeriesApiCall();  // list series mockUserSeries seriesid1 and 2
        test.mockOCastSeriesApiCall3(); // list series mockUserSeries2 seriesid2
        test.mockOCastSeriesApiCall4();  // list series mockUserSeriesEmpty
        test.mockOCastSeriesApiCall5();  // list series mockUserSeriesEmpty
        test.mockOCastSeriesApiCall9();  // get series with seriesid1
        test.mockOCastSeriesApiCall10();  // get series with seriesid2
        test.mockOCastUserApiCall();
        test.mockOCastEvents_1_New_ApiCall();
        test.mockOCastEvents_2_New_ApiCall();
    });

    it('-Contributor FIX- should return events from series where user is contributor', async () => {
        testXXX.mockUserSeriesListCall_elluri_XXX3(); // series id 1 and inbox series id 2
        testXXX.mockUserSeriesListCall_grp_XYZ_XXX(); // series id 1 and inbox series id 2
        const owner = 'elluri';

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', owner ) //'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 2, 'Two events should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_EVENT_1_ID);
        assert.equal(response.body[1].identifier, test.constants.TEST_EVENT_2_ID);
        assert.isArray(response.body[0].visibility, 'Video\'s visibility property should be an array');
        assert.isArray(response.body[1].visibility, 'Video\'s visibility property should be an array');
        assert.lengthOf(response.body[0].visibility, 1, 'Video should have one visibility value');
        assert.equal(response.body[0].visibility, constants.STATUS_PUBLISHED);
        assert.lengthOf(response.body[1].visibility, 1, 'Video should have one visibility value');
        assert.equal(response.body[1].visibility, constants.STATUS_PUBLISHED);

        await wait(100);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(2);
        expect(rows[0].video_id).to.deep.equal(response.body[0].identifier);
        expect(rows[0].archived_date).to.not.be.null;
        expect(rows[1].video_id).to.deep.equal(response.body[1].identifier);
        expect(rows[1].archived_date).to.not.be.null;
    });

    it('-Contributor FIX- Events should have visibility array property', async () => {
        testXXX.mockUserSeriesListCall_elluri_XXX3(); // series id 1 and inbox series id 2
        testXXX.mockUserSeriesListCall_grp_XYZ_XXX(); // series id 1 and inbox series id 2
        const owner = 'elluri';

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', owner) //'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body[0].visibility, 'Video\'s visibility property should be an array');
        assert.isArray(response.body[1].visibility, 'Video\'s visibility property should be an array');

        await wait(100);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(2);
        expect(rows[0].video_id).to.deep.equal(response.body[0].identifier);
        expect(rows[0].archived_date).to.not.be.null;
        expect(rows[1].video_id).to.deep.equal(response.body[1].identifier);
        expect(rows[1].archived_date).to.not.be.null;
    });


    it('-Contributor FIX- Should return events from series where users group is in contributors field', async () => {
        testXXX.mockUserSeriesListCall_elluri_XXX3(); // series id 1 and inbox series id 2
        testXXX.mockUserSeriesListCall_grp_XYZ_XXX(); // series id 1 and inbox series id 2
        const owner = 'elluri';

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', owner)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.lengthOf(response.body, 2, 'Two events should be returned');
        assert.equal(response.body[0].identifier, test.constants.TEST_EVENT_1_ID);
        assert.equal(response.body[1].identifier, test.constants.TEST_EVENT_2_ID);

        await wait(100);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(2);
        expect(rows[0].video_id).to.deep.equal(response.body[0].identifier);
        expect(rows[0].archived_date).to.not.be.null;
        expect(rows[1].video_id).to.deep.equal(response.body[1].identifier);
        expect(rows[1].archived_date).to.not.be.null;
    });


    it('-Contributor FIX- No events should be returned from series where users group is not in contributors field', async () => {
        const userId = 'NOT_CONTRIBUTOR_IN_ANY_SERIES';
        const group1 = 'grp-lataamo-2';
        const group2 = 'grp-lataamo-3';

        testXXX.mockOpencastSeriesApiEmptyResultContributorParam_XXX(userId);
        testXXX.mockOpencastSeriesApiEmptyResultContributorParam_XXX(group1);
        testXXX.mockOpencastSeriesApiEmptyResultContributorParam_XXX(group2);

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENTS_PATH)
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', `${group1};${group2}`)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        assert.isArray(response.body, 'Response should be an array');
        assert.equal(response.body.length, 0);

        await wait(100);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(0);
    });


    it('-Contributor FIX- No events should be returned if user is not contributor in any series', async () => {
        const userId = 'NOT_CONTRIBUTOR_IN_ANY_SERIES';

        testXXX.mockOpencastSeriesApiEmptyResultContributorParam_XXX(userId);
        testXXX.mockOpencastSeriesApiEmptyResultContributorParam_XXX(test.mockTestUser.hyGroupCn);

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

        await wait(100);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(0);
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

    it('Successful series update should return 200 and identifier', async () => {
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

    it('Unsuccessful series update should return 500', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'trash SeriesOwnerEppn', description: 'Trash sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_TRASH_NOT_ALLOWED);
    });

    it('Unsuccessful series update should return 500', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'inbox SeriesOwnerEppn', description: 'Inbox sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED);
    });

    it('"trash" string not allowed in series\' title', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'trash in the title', description: 'Trash sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_TRASH_NOT_ALLOWED);
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
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED);
    });

    it('"TRASH" string not allowed in series\' title', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'TRASH in the title', description: 'Trash sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_TRASH_NOT_ALLOWED);
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
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED);
    });

    it('"TrAsH" string not allowed in series\' title', async () => {
        const userId = 'SeriesOwnerEppn';
        let response = await supertest(app)
            .post(LATAAMO_SERIES_PATH)
            .send({title: 'TrAsH in the title', description: 'Trash sarja'})
            .set('eppn', userId)
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_TRASH_NOT_ALLOWED);
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
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, messageKeys.ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED);
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
        assert.equal(response.body.message, 'error-failed-to-update-event-details');
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

    it('Should move event to trash series when deleted and update skip email status to true', async () => {
        await client.query('INSERT INTO videos (video_id, archived_date, video_creation_date) VALUES (234234234, \'2019-01-01\'::date, \'2010-01-01\'::date)');

        test.mockOpencastEventNoActiveTransaction('234234234');
        test.mockOpencastUpdateEventOK('234234234');
        test.mockOpencastMediaPackageRequest('234234234');
        test.mockOpencastRepublishMetadataRequest('234234234');
        test.mockOpencastTrashSeriesRequest();

        await supertest(app)
            .put(LATAAMO_MOVE_EVENT_TO_TRASH_SERIES + '/234234234')
            .send({title: 'Delete this', description: 'Can be deleted', identifier: '234234234'})
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);


        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(1);
        expect(rows[0].archived_date).to.not.be.null;

        let archivedDateForVideoMarkedForDeletion = new Date();
        archivedDateForVideoMarkedForDeletion.setMonth(archivedDateForVideoMarkedForDeletion.getMonth() + Constants.DEFAULT_VIDEO_MARKED_FOR_DELETION_MONTHS_AMOUNT);

        expect(rows[0].archived_date.toDateString()).to.equal(archivedDateForVideoMarkedForDeletion.toDateString());
        expect(rows[0].skip_email).to.equal(true);
    });

    it('Should update videos archived date and skip email fields and clear notification sent at fields when moved back from trash', async () => {
        await client.query('INSERT INTO videos (video_id, archived_date, video_creation_date, first_notification_sent_at, second_notification_sent_at, third_notification_sent_at, skip_email) ' +
            'VALUES (234234234, \'2019-01-01\'::date, \'2010-01-01\'::date, \'2020-01-01\'::date, \'2020-01-01\'::date, \'2020-01-01\'::date, true)');

        test.mockOpencastEventNoActiveTransaction('234234234');
        test.mockOpencastUpdateEventOK('234234234');
        test.mockOpencastMediaPackageRequest('234234234');
        test.mockOpencastRepublishMetadataRequest('234234234');

        await supertest(app)
            .put(LATAAMO_USER_EVENTS_PATH + '/234234234')
            .send({title: 'Hieno', description: 'Hienon kuvaus', identifier: '234234234', series: 'trashSeriesOwner'})
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(1);
        expect(rows[0].archived_date).to.not.be.null;

        let archivedDateForVideoReturnedFromTrash = new Date();
        archivedDateForVideoReturnedFromTrash.setFullYear(archivedDateForVideoReturnedFromTrash.getFullYear() + Constants.DEFAULT_VIDEO_ARCHIVED_YEAR_AMOUNT);

        expect(rows[0].archived_date.toDateString()).to.equal(archivedDateForVideoReturnedFromTrash.toDateString());
        expect(rows[0].skip_email).to.equal(false);
        expect(rows[0].first_notification_sent_at).to.be.null;
        expect(rows[0].second_notification_sent_at).to.be.null;
        expect(rows[0].third_notification_sent_at).to.be.null;
    });

    it('Should not update videos archived date field when videos metadata is updated', async () => {
        await client.query('INSERT INTO videos (video_id, archived_date, video_creation_date) VALUES (234234234, \'2019-01-01\'::date, \'2010-01-01\'::date)');

        test.mockOpencastEventNoActiveTransaction('234234234');
        test.mockOpencastUpdateEventOK('234234234');
        test.mockOpencastMediaPackageRequest('234234234');
        test.mockOpencastRepublishMetadataRequest('234234234');

        await supertest(app)
            .put(LATAAMO_USER_EVENTS_PATH + '/234234234')
            .send({title: 'Hieno', description: 'Hienon kuvaus', identifier: '234234234', series: 'SeriesOwner'})
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .set('displayName', test.mockTestUser.displayName)
            .expect(200)
            .expect('Content-Type', /json/);

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(1);
        expect(rows[0].archived_date).to.not.be.null;
        const date = new Date(2019, 0, 1);
        const UTC = date.toUTCString();
        expect(rows[0].archived_date.toUTCString()).to.equal(UTC);
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
        test.mockOCastSeriesApiCall9();
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
            { allow: true, role: 'ROLE_ANONYMOUS', action: 'read' },
            { allow: true, role: 'ROLE_USER_KATSOMO_TESTI', action: 'read' }
        ];

        const licenses = [
            'UNITUBE-ALLRIGHTS',
            'CC-BY',
            'CC-BY-NC-ND',
            'CC0'
        ];

        let response = await supertest(app)
            .get(LATAAMO_USER_EVENT_PATH + '/' + test.constants.TEST_EVENT_1_ID)
            .set('eppn', 'SeriesOwnerEppn')
            .set('preferredlanguage', test.mockTestUser.preferredlanguage)
            .set('hyGroupCn', test.mockTestUser.hyGroupCn)
            .expect(200)
            .expect('Content-Type', /json/);
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
            .expect('Content-Type', /json/);
        assert.equal(response.body.message, 'error_failed_to_get_event');
    });
});



