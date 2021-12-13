
// https://medium.com/geoblinktech/postgres-and-integration-testing-in-node-js-apps-2e1b52af7ffc

const chai = require('chai');           // https://www.npmjs.com/package/chai
const assert = chai.assert;
const expect = chai.expect;
const supertest = require('supertest'); // https://www.npmjs.com/package/supertest
const app = require('../../app');

const Pool = require('pg-pool');
const client = require('../../service/database');

let test = require('../testHelper');

// Unitube-lataamo proxy APIs under the test
const LATAAMO_USER_INBOX_EVENTS_PATH = '/api/userInboxEvents';


describe('user inbox events returned from /userInboxEvents route', () => {


    before('Mock db connection and load app', async () => {
        // Create a new pool with a connection limit of 1
        const pool = new Pool({
            user: process.env.POSTGRES_USER,
            host: process.env.HOST,
            database: process.env.DATABASE,
            password: process.env.PASSWORD,
            port: process.env.PORT,
            max: 1, // Reuse the connection to make sure we always hit the same temporal schema
            idleTimeoutMillis: 0 // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
        });

        // Mock the query function to always return a connection from the pool we just created
        client.query = (text, values) => {
            return pool.query(text, values);
        };
    });


    beforeEach(async () => {
        await client.query('CREATE TEMPORARY TABLE videos (LIKE videos INCLUDING ALL)'); // This will copy constraints also
    });


    afterEach('Drop temporary tables', async function () {
        await client.query('DROP TABLE pg_temp.videos');
    });

    beforeEach(async() => {
        // mock needed opencast api calls
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

        const { rows } = await client.query('SELECT * FROM videos');
        expect(rows).lengthOf(0);
    });
});
