const chai = require('chai');
const assert = chai.assert;
const supertest = require('supertest');
const app = require('../../app');

let test = require('../testHelper');

const LATAAMO_USER_PATH = '/api/user';


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

