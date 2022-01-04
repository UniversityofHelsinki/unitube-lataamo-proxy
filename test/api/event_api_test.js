const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const supertest = require('supertest');
const app = require('../../app');

let test = require('../testHelper');
const LATAAMO_USER_EVENT_PATH = '/api/event';
const LATAAMO_USER_INBOX_EVENTS_PATH = '/api/userInboxEvents';
const LATAAMO_USER_TRASH_EVENTS_PATH = '/api/userTrashEvents';

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
            "UNITUBE-ALLRIGHTS",
            "CC-BY",
            "CC-BY-NC-ND",
            "CC0"
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

