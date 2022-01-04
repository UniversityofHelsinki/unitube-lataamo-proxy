const chai = require('chai');
const assert = chai.assert;
const supertest = require('supertest');
const app = require('../../app');

let test = require('../testHelper');
const testXXX = require('../testHelperXXX');

const LATAAMO_USER_SERIES_PATH = '/api/userSeries';
const LATAAMO_SERIES_PATH = '/api/series';

const messageKeys = require('../../utils/message-keys');


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

