const chai = require('chai');
const assert = chai.assert;
const supertest = require('supertest');
const app = require('../../app');

const LATAAMO_API_INFO_PATH = '/api/info';

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















