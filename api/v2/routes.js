const swaggerUi = require("swagger-ui-express");
const {readFileSync} = require("fs");
const user = require("../user");
const persons = require("../persons");
const iamGroups = require("../iamGroups");
const event = require("../event");
const series = require("../series");
const jobs = require("../jobs");
const video = require("../video");
const {resolve} = require("path");
const swaggerDocument = JSON.parse(readFileSync(resolve(__dirname, 'swagger.json')));
module.exports = function (router) {
    router.use('/api-docs', swaggerUi.serve);
    router.get('/api-docs', swaggerUi.setup(swaggerDocument));

    router.get('/user', user.userInfo);
    router.get('/persons/:query', persons.getPersons);
    router.get('/iamGroups/:query', iamGroups.getIamGroups);
    router.get('/event/:id/deletionDate', event.getEventDeletionDate);
    router.get('/event/:id', event.getEvent);
    router.get('/userInboxEvents', event.getInboxEvents);
    router.get('/userSeries', series.getUserSeries);
    router.get('/monitor/:jobId', jobs.getJobStatus);
    router.get('/userVideos', video.getUserVideos);
    router.get('/series/:id', series.getSeries);

};
