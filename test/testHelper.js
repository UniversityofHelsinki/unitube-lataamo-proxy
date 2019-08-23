const nock = require('nock');  // https://www.npmjs.com/package/nock


// mocked Opencast APIs
const CONSTANTS = Object.freeze({
    OCAST_BASE_URL : process.env.LATAAMO_OPENCAST_HOST,
    OCAST_SERIES_PATH : '/api/series/',
    OCAST_VIDEOS_PATH : '/api/events/',
    OCAST_USER_PATH : '/api/info/me',
    OCAST_VIDEO_PUBLICATION_PATH : '/publications',
    OCAST_EVENT_MEDIA_PATH_PREFIX : '/admin-ng/event/',
    OCAST_EVENT_MEDIA_PATH_SUFFIX : '/asset/media/media.json',
    OCAST_EVENT_MEDIA_FILE_METADATA : '/asset/media/',
    OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER : '?filter=series:',
    TEST_SERIES_1_ID : '80f9ff5b-4163-48b7-b7cf-950be665de3c',
    TEST_SERIES_2_ID : 'd72a8c9e-f854-4ba4-9ed2-89405fae214e',
    TEST_EVENT_1_ID : '6394a9b7-3c06-477e-841a-70862eb07bfb',
    TEST_EVENT_2_ID : '1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4',
    TEST_EVENT_3_ID : '23af4ad3-6726-4f3d-bf21-c02b34753c32',
    TEST_MEDIA_1_METADATA_ID : '638b7ae1-0710-44df-b3db-55ee9e8b48ba',
    TEST_MEDIA_2_METADATA_ID : 'e14f98b1-3c61-45e7-8bb0-4a32ef66dac8',
    TEST_MEDIA_3_METADATA_ID : '1ca70749-cb47-403f-8bd2-3484759e68c1',
    CREATOR_AKA_API_USER : 'Opencast Project Administrator'
});


const NO_RESULTS = [];

const mockApiUser =  {
    provider: 'opencast',
    name: CONSTANTS.CREATOR_AKA_API_USER,
    userrole: 'ROLE_USER_ADMIN',
    email: 'admin@localhost',
    username: 'admin'
}

const mockTestUser = {
    eppn: 'Tester-XYZ',
    preferredlanguage: 'fi',
    hyGroupCn: 'grp-XYZ'
}

// TODO: put json into separate files

// these are filtered by contributor (eppn in contributor values)
const mockUserSeries = [
    { identifier: CONSTANTS.TEST_SERIES_1_ID,
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1' ],
        title: 'title-LATAAMO-131'
    },
    { identifier: CONSTANTS.TEST_SERIES_2_ID,
        creator: 'Opencast Project Administrator',
        created: '2019-05-22T09:56:43Z',
        subjects: [ 'juusto', 'makasiini', 'aamupuuro', 'turve', 'salama', 'sämpylä' ],
        organizers: [ 'organizer1' ],
        publishers: [ '' ],
        contributors: [ 'SeriesOwnerEppn', 'Tester A', 'Tester B' ],
        title: 'kuutamossa'
    }
]

const mockUserEventsForSeries1 =  [
    {
        identifier: CONSTANTS.TEST_EVENT_1_ID,
        creator: 'Opencast Project Administrator',
        presenter: [],
        created: '2019-06-12T07:47:49Z',
        subjects: [ 'Testin more' ],
        start: '2019-06-12T07:47:49Z',
        description: '',
        title: 'LATAAMO-103 toka',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: [ 'SeriesOwnerEppn' ],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
    },
    {
        identifier: CONSTANTS.TEST_EVENT_2_ID,
        creator: 'Opencast Project Administrator',
        presenter: [],
        created: '2019-06-11T13:04:43Z',
        subjects: [ 'testing' ],
        start: '2019-06-11T13:04:43Z',
        description: '',
        title: 'LAATAMO-103',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: ['UNKNOWN_CONTRIBUTOR'],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
    }
]

const mockUserEventsForSeries2 =  [
    {
        identifier: CONSTANTS.TEST_EVENT_3_ID,
        creator: 'lataamo_testi',
        presenter: [],
        created: '2016-06-22T13:30:00Z',
        subjects: [ 'John Clark', 'Thiago Melo Costa' ],
        start: '2016-06-22T13:30:00Z',
        description: 'A great description',
        title: 'Captivating title',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: ['SeriesOwnerEppn', 'Other'],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
    }
]


// /api/series/80f9ff5b-4163-48b7-b7cf-950be665de3c/acl
const eventAclsFromSerie = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/series/${CONSTANTS.TEST_SERIES_1_ID}/acl`)
    .reply(200, eventACLs).persist(); // this url will be called several times so let's persist

const eventACLs =  [
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ANONYMOUS', action: 'read' }
]

// /api/series/d72a8c9e-f854-4ba4-9ed2-89405fae214e/acl
const eventAclsFromSerie2 = () => {
    return nock(CONSTANTS.OCAST_BASE_URL)
        .get(`/api/series/${CONSTANTS.TEST_SERIES_2_ID}/acl`)
        .reply(200, event2ACLs).persist(); // this url will be called several times so let's persist
}

const event2ACLs =  [
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ANONYMOUS', action: 'read' },
    { allow: true, role: '123_Instructor', action: 'read' },
    { allow: true, role: '123_Learner', action: 'read' },
]

// /admin-ng/event/6394a9b7-3c06-477e-841a-70862eb07bfb/asset/media/638b7ae1-0710-44df-b3db-55ee9e8b48ba.json
const event1MediaMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_EVENT_1_ID}/asset/media/${CONSTANTS.TEST_MEDIA_1_METADATA_ID}.json`)
    .reply(200, mediaMetadata1);

// /admin-ng/event/1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4/asset/media/e14f98b1-3c61-45e7-8bb0-4a32ef66dac8.json
const event2MediaMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_EVENT_2_ID}/asset/media/${CONSTANTS.TEST_MEDIA_2_METADATA_ID}.json`)
    .reply(200, mediaMetadata2);

// /admin-ng/event/23af4ad3-6726-4f3d-bf21-c02b34753c32/asset/media/1ca70749-cb47-403f-8bd2-3484759e68c1.json
const event3MediaMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_EVENT_3_ID}/asset/media/${CONSTANTS.TEST_MEDIA_3_METADATA_ID}.json`)
    .reply(200, mediaMetadata3);


const mediaMetadata1 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: "the file", video: "the file" },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_1_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_1_ID}/${CONSTANTS.TEST_MEDIA_1_METADATA_ID}/7/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
}

const mediaMetadata2 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: "the file", video: "the file" },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_2_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_2_ID}/${CONSTANTS.TEST_MEDIA_2_METADATA_ID}/7/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
}

const mediaMetadata3 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: "the file", video: "the file" },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_3_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_3_ID}/${CONSTANTS.TEST_MEDIA_3_METADATA_ID}/7/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
}

const mockMediaData2 = [ {
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_2_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_2_ID}/${CONSTANTS.TEST_MEDIA_2_METADATA_ID}/7/fruits_on_table.mp4`,
    tags: [ 'archive' ]
}
]

const mockMediaData1 = [{
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_1_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_1_ID}/${CONSTANTS.TEST_MEDIA_1_METADATA_ID}/7/fruits_on_table.mp4`,
    tags: [ 'archive' ]
}
]

const mockMediaData3 = [ {
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_3_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_3_ID}/${CONSTANTS.TEST_MEDIA_3_METADATA_ID}/7/fruits_on_table.mp4`,
    tags: [ 'archive' ]
}
]

// /admin-ng/event/6394a9b7-3c06-477e-841a-70862eb07bfb/asset/media/media.json
const event1Media = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_EVENT_1_ID}/asset/media/media.json`)
    .reply(200, mockMediaData1);

// /admin-ng/event/1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4/asset/media/media.json
const event2Media = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_EVENT_2_ID}/asset/media/media.json`)
    .reply(200, mockMediaData2);

// /admin-ng/event/23af4ad3-6726-4f3d-bf21-c02b34753c32/asset/media/media.json
const event3Media = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_EVENT_3_ID}/asset/media/media.json`)
    .reply(200, mockMediaData3);

const mockEventMetadata1 = [{"flavor":"dublincore\/episode","title":"EVENTS.EVENTS.DETAILS.CATALOG.EPISODE","fields":[{"readOnly":false,"id":"title","label":"EVENTS.EVENTS.DETAILS.METADATA.TITLE","type":"text","value":"LATAAMO-103 toka","required":true},{"readOnly":false,"id":"subjects","label":"EVENTS.EVENTS.DETAILS.METADATA.SUBJECT","type":"text","value":["Testin more"],"required":false},{"readOnly":false,"id":"description","label":"EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION","type":"text_long","value":"","required":false},{"translatable":true,"readOnly":false,"id":"language","label":"EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE","type":"text","value":"","required":false},{"readOnly":false,"id":"rightsHolder","label":"EVENTS.EVENTS.DETAILS.METADATA.RIGHTS","type":"text","value":"","required":false},{"translatable":true,"readOnly":false,"id":"license","label":"EVENTS.EVENTS.DETAILS.METADATA.LICENSE","type":"text","value":"ALLRIGHTS","required":false},{"translatable":false,"readOnly":false,"id":"isPartOf","label":"EVENTS.EVENTS.DETAILS.METADATA.SERIES","type":"text","value":"80f9ff5b-4163-48b7-b7cf-950be665de3c","required":false},{"translatable":false,"readOnly":false,"id":"creator","label":"EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS","type":"mixed_text","value":[],"required":false},{"translatable":false,"readOnly":false,"id":"contributor","label":"EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS","type":"mixed_text","value":["tzrasane"],"required":false},{"readOnly":false,"id":"startDate","label":"EVENTS.EVENTS.DETAILS.METADATA.START_DATE","type":"date","value":"2019-06-12","required":false},{"readOnly":false,"id":"startTime","label":"EVENTS.EVENTS.DETAILS.METADATA.START_TIME","type":"time","value":"07:47","required":false},{"readOnly":false,"id":"duration","label":"EVENTS.EVENTS.DETAILS.METADATA.DURATION","type":"text","value":"00:00:00","required":false},{"readOnly":false,"id":"location","label":"EVENTS.EVENTS.DETAILS.METADATA.LOCATION","type":"text","value":"","required":false},{"readOnly":false,"id":"source","label":"EVENTS.EVENTS.DETAILS.METADATA.SOURCE","type":"text","value":"","required":false},{"readOnly":true,"id":"created","label":"EVENTS.EVENTS.DETAILS.METADATA.CREATED","type":"date","value":"2019-06-12T07:47:49.000Z","required":false},{"readOnly":true,"id":"identifier","label":"EVENTS.EVENTS.DETAILS.METADATA.ID","type":"text","value":CONSTANTS.TEST_EVENT_1_ID,"required":false}]}]
const mockEventMetadata2 = [{"flavor":"dublincore\/episode","title":"EVENTS.EVENTS.DETAILS.CATALOG.EPISODE","fields":[{"readOnly":false,"id":"title","label":"EVENTS.EVENTS.DETAILS.METADATA.TITLE","type":"text","value":"LAATAMO-103","required":true},{"readOnly":false,"id":"subjects","label":"EVENTS.EVENTS.DETAILS.METADATA.SUBJECT","type":"text","value":["testing"],"required":false},{"readOnly":false,"id":"description","label":"EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION","type":"text_long","value":"","required":false},{"translatable":true,"readOnly":false,"id":"language","label":"EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE","type":"text","value":"","required":false},{"readOnly":false,"id":"rightsHolder","label":"EVENTS.EVENTS.DETAILS.METADATA.RIGHTS","type":"text","value":"","required":false},{"translatable":true,"readOnly":false,"id":"license","label":"EVENTS.EVENTS.DETAILS.METADATA.LICENSE","type":"text","value":"ALLRIGHTS","required":false},{"translatable":false,"readOnly":false,"id":"isPartOf","label":"EVENTS.EVENTS.DETAILS.METADATA.SERIES","type":"text","value":"80f9ff5b-4163-48b7-b7cf-950be665de3c","required":false},{"translatable":false,"readOnly":false,"id":"creator","label":"EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS","type":"mixed_text","value":[],"required":false},{"translatable":false,"readOnly":false,"id":"contributor","label":"EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS","type":"mixed_text","value":["tzrasane"],"required":false},{"readOnly":false,"id":"startDate","label":"EVENTS.EVENTS.DETAILS.METADATA.START_DATE","type":"date","value":"2019-06-11","required":false},{"readOnly":false,"id":"startTime","label":"EVENTS.EVENTS.DETAILS.METADATA.START_TIME","type":"time","value":"13:04","required":false},{"readOnly":false,"id":"duration","label":"EVENTS.EVENTS.DETAILS.METADATA.DURATION","type":"text","value":"00:00:00","required":false},{"readOnly":false,"id":"location","label":"EVENTS.EVENTS.DETAILS.METADATA.LOCATION","type":"text","value":"","required":false},{"readOnly":false,"id":"source","label":"EVENTS.EVENTS.DETAILS.METADATA.SOURCE","type":"text","value":"","required":false},{"readOnly":true,"id":"created","label":"EVENTS.EVENTS.DETAILS.METADATA.CREATED","type":"date","value":"2019-06-11T13:04:43.000Z","required":false},{"readOnly":true,"id":"identifier","label":"EVENTS.EVENTS.DETAILS.METADATA.ID","type":"text","value":CONSTANTS.TEST_EVENT_2_ID,"required":false}]}]
const mockEventMetadata3 = [{"flavor":"dublincore\/episode","title":"EVENTS.EVENTS.DETAILS.CATALOG.EPISODE","fields":[{"readOnly":false,"id":"title","label":"EVENTS.EVENTS.DETAILS.METADATA.TITLE","type":"text","value":"Captivating title","required":true},{"readOnly":false,"id":"subjects","label":"EVENTS.EVENTS.DETAILS.METADATA.SUBJECT","type":"text","value":["John Clark","Thiago Melo Costa"],"required":false},{"readOnly":false,"id":"description","label":"EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION","type":"text_long","value":"A great description","required":false},{"translatable":true,"readOnly":false,"id":"language","label":"EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE","type":"text","value":"","required":false},{"readOnly":false,"id":"rightsHolder","label":"EVENTS.EVENTS.DETAILS.METADATA.RIGHTS","type":"text","value":"","required":false},{"translatable":true,"readOnly":false,"id":"license","label":"EVENTS.EVENTS.DETAILS.METADATA.LICENSE","type":"text","value":"","required":false},{"translatable":false,"readOnly":false,"id":"isPartOf","label":"EVENTS.EVENTS.DETAILS.METADATA.SERIES","type":"text","value":"d72a8c9e-f854-4ba4-9ed2-89405fae214e","required":false},{"translatable":false,"readOnly":false,"id":"creator","label":"EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS","type":"mixed_text","value":[],"required":false},{"translatable":false,"readOnly":false,"id":"contributor","label":"EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS","type":"mixed_text","value":[],"required":false},{"readOnly":false,"id":"startDate","label":"EVENTS.EVENTS.DETAILS.METADATA.START_DATE","type":"date","value":"2016-06-22","required":false},{"readOnly":false,"id":"startTime","label":"EVENTS.EVENTS.DETAILS.METADATA.START_TIME","type":"time","value":"13:30","required":false},{"readOnly":false,"id":"duration","label":"EVENTS.EVENTS.DETAILS.METADATA.DURATION","type":"text","value":"00:00:00","required":false},{"readOnly":false,"id":"location","label":"EVENTS.EVENTS.DETAILS.METADATA.LOCATION","type":"text","value":"","required":false},{"readOnly":false,"id":"source","label":"EVENTS.EVENTS.DETAILS.METADATA.SOURCE","type":"text","value":"","required":false},{"readOnly":true,"id":"created","label":"EVENTS.EVENTS.DETAILS.METADATA.CREATED","type":"date","value":"2016-06-22T13:30:00.000Z","required":false},{"readOnly":true,"id":"identifier","label":"EVENTS.EVENTS.DETAILS.METADATA.ID","type":"text","value":CONSTANTS.TEST_EVENT_3_ID,"required":false}]}]

// /api/6394a9b7-3c06-477e-841a-70862eb07bfb/metadata
const eventMetadata_1 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/${CONSTANTS.TEST_EVENT_1_ID}/metadata`)
    .reply(200, mockEventMetadata1);

// /api/1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4/metadata
const eventMetadata_2 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/${CONSTANTS.TEST_EVENT_2_ID}/metadata`)
    .reply(200, mockEventMetadata2);

// /api/23af4ad3-6726-4f3d-bf21-c02b34753c32/metadata
const eventMetadata_3 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/${CONSTANTS.TEST_EVENT_3_ID}/metadata`)
    .reply(200, mockEventMetadata3);

// events by series /api/events/?filter=series:80f9ff5b-4163-48b7-b7cf-950be665de3c
const series1_Events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:${CONSTANTS.TEST_SERIES_1_ID}`})
    .reply(200, mockUserEventsForSeries1);

// events by series /api/events/?filter=series:series:d72a8c9e-f854-4ba4-9ed2-89405fae214e
const series2_Events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:${CONSTANTS.TEST_SERIES_2_ID}`})
    .reply(200, mockUserEventsForSeries2);

// /api/series/?filter=Creator:Opencast Project Administrator
const lataamoSeries = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_SERIES_PATH)
    .reply(200, mockUserSeries);

// /api/info/me
const lataamoApiUser = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_USER_PATH)
    .reply(200, mockApiUser);

const cleanMocks = () => nock.cleanAll();


module.exports.mockApiUser = mockApiUser;
module.exports.mockTestUser = mockTestUser;
module.exports.mockOCastSeriesApiCall = lataamoSeries;
module.exports.mockOCastUserApiCall = lataamoApiUser;
module.exports.mockOCastEvents_1_ApiCall = series1_Events;
module.exports.mockOCastEvents_2_ApiCall = series2_Events;
module.exports.mockOCastEventMetadata_1Call = eventMetadata_1;
module.exports.mockOCastEventMetadata_2Call = eventMetadata_2;
module.exports.mockOCastEventMetadata_3Call = eventMetadata_3;
module.exports.mockOCastEvent1MediaCall = event1Media;
module.exports.mockOCastEvent2MediaCall = event2Media;
module.exports.mockOCastEvent3MediaCall = event3Media;
module.exports.mockOCastEvent1MediaMetadataCall = event1MediaMetadata;
module.exports.mockOCastEvent2MediaMetadataCall = event2MediaMetadata;
module.exports.mockOCastEvent3MediaMetadataCall = event3MediaMetadata;
module.exports.mockOCastEvent1AclCall = eventAclsFromSerie;
module.exports.mockOcastEvent2AclCall = eventAclsFromSerie2;
module.exports.constants = CONSTANTS;

module.exports.cleanAll = cleanMocks;