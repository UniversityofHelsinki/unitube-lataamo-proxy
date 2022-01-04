const chai = require('chai');
const assert = chai.assert;
const supertest = require('supertest');
const app = require('../../app');

let test = require('../testHelper');
const testXXX = require("../testHelperXXX");
const constants = require("../../utils/constants");

const LATAAMO_API_VIDEO_PATH = '/api/videoUrl/';
const LATAAMO_USER_EVENTS_PATH = '/api/userVideos';
const LATAAMO_MOVE_EVENT_TO_TRASH_SERIES = '/api/moveEventToTrash';

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
    });
});

afterEach(() => {
    test.cleanAll();
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

    it('Should move event to trash series when deleted', async () => {

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
    });
});

afterEach(() => {
    test.cleanAll();
});
