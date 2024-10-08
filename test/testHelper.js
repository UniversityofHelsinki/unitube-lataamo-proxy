const nock = require('nock');  // https://www.npmjs.com/package/nock
const constPaths = require('../utils/constants');

// mocked Opencast APIs
const CONSTANTS = Object.freeze({
    OCAST_BASE_URL : process.env.LATAAMO_OPENCAST_HOST,
    OCAST_SERIES_PATH : '/api/series/',
    OCAST_VIDEO_VIEWS_PATH : '/usertracking/',
    OCAST_ACL : '/acl',
    OCAST_UPDATE_SERIES_PATH : '/api/series/123456',
    OCAST_UPDATE_SERIES_METADATA_PATH :  '/metadata?type=dublincore/series',
    OCAST_VIDEOS_PATH : '/api/events/',
    OCAST_USER_PATH : '/api/info/me',
    OCAST_VIDEO_PUBLICATION_PATH : '/publications',
    OCAST_EVENT_EPISODE_PATH: '/search/episode.json',
    OCAST_EVENT_MEDIA_PATH_PREFIX : '/admin-ng/event/',
    OCAST_EVENT_MEDIA_PATH_SUFFIX : '/asset/media/media.json',
    OCAST_EVENT_MEDIA_FILE_METADATA : '/asset/media/',
    OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER : '?filter=series:',
    OCAST_VIDEOS_FILTER_USER_NAME: '?filter=title:',
    TEST_INBOX_SERIES_ID : '3f9ff5b-7663-54b7-b7cf-950be665de3c',
    TEST_TRASH_SERIES_ID : '3f9ff5b-7663-54b7-b7cf-950be665de3c',
    TEST_INBOX_EVENT_1: '11111',
    TEST_INBOX_EVENT_2: '22222',
    TEST_TRASH_EVENT_1: '33333',
    TEST_TRASH_EVENT_2: '44444',
    TEST_SERIES_1_ID : '80f9ff5b-4163-48b7-b7cf-950be665de3c',
    TEST_SERIES_2_ID : 'd72a8c9e-f854-4ba4-9ed2-89405fae214e',
    TEST_SERIES_3_ID : '604d78ac-733f-4c65-b13a-29172fbc0c6f',
    TEST_EVENT_1_ID : '6394a9b7-3c06-477e-841a-70862eb07bfb',
    TEST_EVENT_2_ID : '1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4',
    TEST_EVENT_3_ID : '23af4ad3-6726-4f3d-bf21-c02b34753c32',
    TEST_MEDIA_1_INBOX_METADATA_ID : '333333',
    TEST_MEDIA_2_INBOX_METADATA_ID : '444444',
    TEST_MEDIA_1_TRASH_METADATA_ID : '333333',
    TEST_MEDIA_2_TRASH_METADATA_ID : '444444',
    TEST_MEDIA_1_METADATA_ID : '638b7ae1-0710-44df-b3db-55ee9e8b48ba',
    TEST_MEDIA_2_METADATA_ID : 'e14f98b1-3c61-45e7-8bb0-4a32ef66dac8',
    TEST_MEDIA_3_METADATA_ID : '1ca70749-cb47-403f-8bd2-3484759e68c1',
    CREATOR_AKA_API_USER : 'Opencast Project Administrator',
    SUCCESSFUL_UPDATE_ID : '123456',
    OCAST_EVENT_PATH : '/api/event',
    SERIES_OWNER_EPPN : 'SeriesOwnerEppn',
    INBOX: 'inbox',
    TRASH: 'trash',
    OCAST_VIDEOS_WITH_METADATA_ACLS_AND_PUBLICATIONS : '&withmetadata=false&withacl=true&withpublications=true'
});


const NO_RESULTS = [];

const mockApiUser =  {
    provider: 'opencast',
    name: CONSTANTS.CREATOR_AKA_API_USER,
    userrole: 'ROLE_USER_ADMIN',
    email: 'admin@localhost',
    username: 'admin'
};

const mockTestUser = {
    eppn: 'Tester-XYZ',
    preferredlanguage: 'fi',
    hyGroupCn: 'grp-XYZ',
    displayName: 'Matti Meikalainen'
};

const mockTestUser2 = {
    eppn: 'Tester-XYZ',
    preferredlanguage: 'fi',
    hyGroupCn: 'grp-lataamo-6'
};

const mockTestUser3 = {
    eppn: 'tester-xyz',
    preferredlanguage: 'fi'
};


// TODO: put json into separate files

const mockUserNoSeries = [];

const mockUserTrashSeries = [
    { identifier: CONSTANTS.TEST_TRASH_SERIES_ID,
        creator: 'Opencast Project Administrator',
        created: '2019-05-22T09:56:43Z',
        subjects: [''],
        organizers: [ 'SeriesOwnerEppn' ],
        publishers: [ 'SeriesOwnerEppn' ],
        contributors: [ 'SeriesOwnerEppn'],
        title: 'trash SeriesOwnerEppn'
    }];

const mockUserInboxSeries = [
    { identifier: CONSTANTS.TEST_INBOX_SERIES_ID,
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'inbox SeriesOwnerEppn'
    }
];

const mockUserInboxSeries2 = [
    { identifier: CONSTANTS.TEST_INBOX_SERIES_ID,
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'inbox SeriesOwnerEppn'
    },
    { identifier: CONSTANTS.TEST_SERIES_2_ID,
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'SERIES_OWNER_EPPN'
    }
];



const mockUserInboxSeries3 = [
    { identifier: CONSTANTS.TEST_INBOX_SERIES_ID,
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'inbox SeriesOwnerEppn'
    },
    { identifier: CONSTANTS.TEST_SERIES_2_ID,
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'inbox tester-xyz'
    }
];


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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'title-LATAAMO-131'
    },
    { identifier: CONSTANTS.TEST_SERIES_2_ID,
        creator: 'Opencast Project Administrator',
        created: '2019-05-22T09:56:43Z',
        subjects: [ 'juusto', 'makasiini', 'aamupuuro', 'turve', 'salama', 'sämpylä' ],
        organizers: [ 'organizer1' ],
        publishers: [ '' ],
        contributors: [ 'SeriesOwnerEppn', 'Tester A', 'Tester B', 'Tester-XYZ' ],
        title: 'kuutamossa'
    }
];

const mockUserSeries2 = [
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'title-LATAAMO-131'
    }
];

const mockUserSeries3 = [
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
        contributors: [ 'SeriesOwnerEppn', 'contrib1', 'jaaki', 'grp-lataamo-1', 'grp-XYZ'],
        title: 'title-LATAAMO-131'
    },
    { identifier: CONSTANTS.TEST_SERIES_2_ID,
        creator: 'Opencast Project Administrator',
        created: '2019-05-22T09:56:43Z',
        subjects: [ 'juusto', 'makasiini', 'aamupuuro', 'turve', 'salama', 'sämpylä' ],
        organizers: [ 'organizer1' ],
        publishers: [ '' ],
        contributors: [ 'SeriesOwnerEppn', 'Tester A', 'Tester B', 'Tester-XYZ' ],
        title: 'kuutamossa'
    },
    { identifier: CONSTANTS.TEST_SERIES_3_ID,
        creator: 'Opencast Project Administrator',
        created: '2019-05-22T09:56:43Z',
        subjects: [ 'juusto', 'makasiini', 'aamupuuro', 'salama', 'sämpylä' ],
        organizers: [ 'organizer1' ],
        publishers: [ '' ],
        contributors: [ 'SeriesOwnerEppn', 'Tester B', 'Tester-XYZ' ],
        title: 'title-LATAAMO-132'
    }
];

const mockUserSeries5 = [
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
        contributors: [ 'SeriesOwnerEppn'],
        title: 'inbox SeriesOwnerEppn'
    }
];

const mockUserSeries4 =
    { identifier: CONSTANTS.TEST_SERIES_1_ID,
        creator: 'Opencast Project Administrator',
        created: '2019-05-22T09:56:43Z',
        subjects: [ 'juusto', 'makasiini', 'aamupuuro', 'salama', 'sämpylä' ],
        organizers: [ 'organizer1' ],
        publishers: [ '' ],
        contributors: ['baabenom', 'grp-a9000-johto', 'e0008344', 'sys-personec-1', 'alanevax', 'hy-duunarit', 'Tester-XYZ'],
        title: 'title-LATAAMO-132'
    };

const mockUserSeries6 =
    { identifier: CONSTANTS.TEST_SERIES_2_ID,
        creator: 'Opencast Project Administrator',
        created: '2019-05-22T09:56:43Z',
        subjects: [ 'juusto', 'makasiini', 'aamupuuro', 'salama', 'sämpylä' ],
        organizers: [ 'organizer1' ],
        publishers: [ '' ],
        contributors: ['baabenom', 'grp-a9000-johto', 'e0008344', 'sys-personec-1', 'alanevax', 'hy-duunarit'],
        title: 'title-LATAAMO-132'
    };

const mockVideoStats =
    {
        "stats":{"id": CONSTANTS.TEST_EVENT_1_ID,"views":5}
    };

const mockUserSeriesEmpty = [];

const mockUserEventsForInboxSeriesForList = [
    {
        "metadata": [
            {
                "flavor": "dublincore/episode",
                "title": "EVENTS.EVENTS.DETAILS.CATALOG.EPISODE",
                "fields": [
                    {
                        "readOnly": false,
                        "id": "title",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.TITLE",
                        "type": "text",
                        "value": "alle sekunnin testilö.mp4",
                        "required": true
                    },
                    {
                        "readOnly": false,
                        "id": "subjects",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SUBJECT",
                        "type": "text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "description",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION",
                        "type": "text_long",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "language",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "rightsHolder",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.RIGHTS",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "license",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LICENSE",
                        "type": "ordered_text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "isPartOf",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SERIES",
                        "type": "text",
                        "value": "dee7b522-b547-4faa-93fe-04cdd92568ca",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "creator",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "contributor",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "startDate",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.START_DATE",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "duration",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DURATION",
                        "type": "text",
                        "value": "00:00:00",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "location",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LOCATION",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "source",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SOURCE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "created",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CREATED",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "publisher",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "identifier",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.ID",
                        "type": "text",
                        "value": "34a1a436-353b-40c7-805e-4d36c10ac89d",
                        "required": false
                    }
                ]
            }
        ],
        "description": "",
        "language": "",
        "source": "",
        "acl": [
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "read"
            },
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "write"
            }
        ],
        "title": 'INBOX EVENT 1',
        "duration": 0,
        "contributor": ['SeriesOwnerEppn'],
        "publication_status": [
            "internal",
            "engage-player",
            "api",
            "oaipmh-default"
        ],
        "identifier": CONSTANTS.TEST_INBOX_EVENT_1,
        "creator": "Opencast Project Administrator",
        "presenter": [],
        "created": "2021-10-12T14:11:00Z",
        "is_part_of": "dee7b522-b547-4faa-93fe-04cdd92568ca",
        "subjects": [],
        "start": "2021-10-12T14:11:00Z",
        "processing_state": "SUCCEEDED",
        "license": "",
        "archive_version": 3,
        "series": "inbox vmheikki",
        "has_previews": true,
        "location": "",
        "rightsholder": "",
        "status": "EVENTS.EVENTS.STATUS.PROCESSED",
        "publications": [
            {
                "metadata": [],
                "attachments": [],
                "channel": "engage-player",
                "id": "96dc60ad-9055-49ec-b5ea-de45cc8e3a3b",
                "media": [],
                "mediatype": "text/html",
                "url": "http://localhost:8080/engage/theodul/ui/core.html?id=34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [
                    {
                        "flavor": "dublincore/episode",
                        "size": -1,
                        "checksum": "",
                        "id": "0fed6a66-a71d-443e-ae08-018c226304a9",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a11af19-bb48-4f19-9a2d-a0c243e7c5ab/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "dublincore/series",
                        "size": -1,
                        "checksum": "3b4c7233b40e10bd3a7ce77ecf627b24 (md5)",
                        "id": "733c2a98-7480-4f71-8866-e3611622e1fd",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e256a56b-ffcb-48cf-b180-c816bd02d357/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    }
                ],
                "attachments": [
                    {
                        "flavor": "presenter/player+preview",
                        "ref": "",
                        "size": 0,
                        "checksum": "",
                        "id": "2b0bf337-abaa-4e0f-83ed-4994508f43ab",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a49daa5-31e7-45a0-879d-fdc0a34fc26f/coverimage.png",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/search+preview",
                        "ref": "track:cb53eb70-5e42-4eb6-a5f4-a7ec64ed84b4",
                        "size": 0,
                        "checksum": "",
                        "id": "c373c129-99df-4486-80de-0b483435d3e5",
                        "mediatype": "image/jpeg",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/9a429c50-031a-4904-bd13-e9141a0b8e16/alle_sekunnin_testilo__1_000s_search.jpg",
                        "tags": [
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/timeline+preview",
                        "ref": "track:track-4",
                        "size": 0,
                        "checksum": "",
                        "id": "cdc8b8b4-6a16-4b61-b57b-10dc2203631d",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e7dbd8bc-15d9-4b17-96fb-057a4673699a/alle_sekunnin_testilo__e9fa7cfb_3d10_44c5_a073_819f287f8e9d_timelinepreviews.png",
                        "tags": [
                            "engage-download"
                        ]
                    }
                ],
                "channel": "api",
                "id": "f0b4b9bc-46dc-4fef-80ae-5c23f2d6c326",
                "media": [
                    {
                        "has_audio": true,
                        "framerate": 25,
                        "description": "",
                        "bitrate": 220888,
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/3cbcb6e7-1d25-4cfa-ae79-6b220fde6966/alle_sekunnin_testilo_.mp4",
                        "has_video": true,
                        "tags": [
                            "720p-quality",
                            "engage-download",
                            "engage-streaming"
                        ],
                        "flavor": "presenter/delivery",
                        "duration": 1045,
                        "size": -1,
                        "framecount": 25,
                        "checksum": "6fdc0708a86963220c859546b95649f7 (md5)",
                        "width": 870,
                        "id": "33f776ce-bee8-4bfa-ae87-ea4a6949868b",
                        "mediatype": "video/mp4",
                        "height": 594
                    }
                ],
                "mediatype": "application/json",
                "url": "http://localhost:8080/api/events/34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "oaipmh-default",
                "id": "29f1a0ed-e294-4828-af47-7b244014c100",
                "media": [],
                "mediatype": "text/xml",
                "url": "/oaipmh/default?verb=ListMetadataFormats&identifier=34a1a436-353b-40c7-805e-4d36c10ac89d"
            }
        ]
    },
    {
        "metadata": [
            {
                "flavor": "dublincore/episode",
                "title": "EVENTS.EVENTS.DETAILS.CATALOG.EPISODE",
                "fields": [
                    {
                        "readOnly": false,
                        "id": "title",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.TITLE",
                        "type": "text",
                        "value": "alle sekunnin testilö.mp4",
                        "required": true
                    },
                    {
                        "readOnly": false,
                        "id": "subjects",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SUBJECT",
                        "type": "text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "description",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION",
                        "type": "text_long",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "language",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "rightsHolder",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.RIGHTS",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "license",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LICENSE",
                        "type": "ordered_text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "isPartOf",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SERIES",
                        "type": "text",
                        "value": "dee7b522-b547-4faa-93fe-04cdd92568ca",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "creator",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "contributor",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "startDate",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.START_DATE",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "duration",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DURATION",
                        "type": "text",
                        "value": "00:00:00",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "location",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LOCATION",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "source",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SOURCE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "created",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CREATED",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "publisher",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "identifier",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.ID",
                        "type": "text",
                        "value": "34a1a436-353b-40c7-805e-4d36c10ac89d",
                        "required": false
                    }
                ]
            }
        ],
        "description": "",
        "language": "",
        "source": "",
        "acl": [
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "read"
            },
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "write"
            }
        ],
        "title": 'INBOX EVENT 2',
        "duration": 0,
        "contributor": ['SeriesOwnerEppn'],
        "publication_status": [
            "internal",
            "engage-player",
            "api",
            "oaipmh-default"
        ],
        "identifier": CONSTANTS.TEST_INBOX_EVENT_2,
        "creator": "Opencast Project Administrator",
        "presenter": [],
        "created": "2021-10-12T14:11:00Z",
        "is_part_of": "dee7b522-b547-4faa-93fe-04cdd92568ca",
        "subjects": [],
        "start": "2021-10-12T14:11:00Z",
        "processing_state": "SUCCEEDED",
        "license": "",
        "archive_version": 3,
        "series": "inbox vmheikki",
        "has_previews": true,
        "location": "",
        "rightsholder": "",
        "status": "EVENTS.EVENTS.STATUS.PROCESSED",
        "publications": [
            {
                "metadata": [],
                "attachments": [],
                "channel": "engage-player",
                "id": "96dc60ad-9055-49ec-b5ea-de45cc8e3a3b",
                "media": [],
                "mediatype": "text/html",
                "url": "http://localhost:8080/engage/theodul/ui/core.html?id=34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [
                    {
                        "flavor": "dublincore/episode",
                        "size": -1,
                        "checksum": "",
                        "id": "0fed6a66-a71d-443e-ae08-018c226304a9",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a11af19-bb48-4f19-9a2d-a0c243e7c5ab/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "dublincore/series",
                        "size": -1,
                        "checksum": "3b4c7233b40e10bd3a7ce77ecf627b24 (md5)",
                        "id": "733c2a98-7480-4f71-8866-e3611622e1fd",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e256a56b-ffcb-48cf-b180-c816bd02d357/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    }
                ],
                "attachments": [
                    {
                        "flavor": "presenter/player+preview",
                        "ref": "",
                        "size": 0,
                        "checksum": "",
                        "id": "2b0bf337-abaa-4e0f-83ed-4994508f43ab",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a49daa5-31e7-45a0-879d-fdc0a34fc26f/coverimage.png",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/search+preview",
                        "ref": "track:cb53eb70-5e42-4eb6-a5f4-a7ec64ed84b4",
                        "size": 0,
                        "checksum": "",
                        "id": "c373c129-99df-4486-80de-0b483435d3e5",
                        "mediatype": "image/jpeg",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/9a429c50-031a-4904-bd13-e9141a0b8e16/alle_sekunnin_testilo__1_000s_search.jpg",
                        "tags": [
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/timeline+preview",
                        "ref": "track:track-4",
                        "size": 0,
                        "checksum": "",
                        "id": "cdc8b8b4-6a16-4b61-b57b-10dc2203631d",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e7dbd8bc-15d9-4b17-96fb-057a4673699a/alle_sekunnin_testilo__e9fa7cfb_3d10_44c5_a073_819f287f8e9d_timelinepreviews.png",
                        "tags": [
                            "engage-download"
                        ]
                    }
                ],
                "channel": "api",
                "id": "f0b4b9bc-46dc-4fef-80ae-5c23f2d6c326",
                "media": [
                    {
                        "has_audio": true,
                        "framerate": 25,
                        "description": "",
                        "bitrate": 220888,
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/3cbcb6e7-1d25-4cfa-ae79-6b220fde6966/alle_sekunnin_testilo_.mp4",
                        "has_video": true,
                        "tags": [
                            "720p-quality",
                            "engage-download",
                            "engage-streaming"
                        ],
                        "flavor": "presenter/delivery",
                        "duration": 1045,
                        "size": -1,
                        "framecount": 25,
                        "checksum": "6fdc0708a86963220c859546b95649f7 (md5)",
                        "width": 870,
                        "id": "33f776ce-bee8-4bfa-ae87-ea4a6949868b",
                        "mediatype": "video/mp4",
                        "height": 594
                    }
                ],
                "mediatype": "application/json",
                "url": "http://localhost:8080/api/events/34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "oaipmh-default",
                "id": "29f1a0ed-e294-4828-af47-7b244014c100",
                "media": [],
                "mediatype": "text/xml",
                "url": "/oaipmh/default?verb=ListMetadataFormats&identifier=34a1a436-353b-40c7-805e-4d36c10ac89d"
            }
        ]
    }
];

const mockEvent = {
        is_part_of: '3f9ff5b-7663-54b7-b7cf-950be665de3c',
        identifier: '234234234',
        creator: 'Opencast Project Administrator',
        presenter: [],
        created: '2019-06-12T07:47:49Z',
        subjects: [ 'Testin more' ],
        start: '2019-06-12T07:47:49Z',
        description: '',
        title: 'INBOX EVENT 1',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: [ 'SeriesOwnerEppn' ],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
};

const mockUserEventsForInboxSeries =  [
    {
        identifier: CONSTANTS.TEST_INBOX_EVENT_1,
        creator: 'Opencast Project Administrator',
        presenter: [],
        created: '2019-06-12T07:47:49Z',
        subjects: [ 'Testin more' ],
        start: '2019-06-12T07:47:49Z',
        description: '',
        title: 'INBOX EVENT 1',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: [ 'SeriesOwnerEppn' ],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
    },
    {
        identifier: CONSTANTS.TEST_INBOX_EVENT_2,
        creator: 'Opencast Project Administrator',
        presenter: [],
        created: '2019-06-11T13:04:43Z',
        subjects: [ 'testing' ],
        start: '2019-06-11T13:04:43Z',
        description: '',
        title: 'INBOX EVENT 2',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: ['SeriesOwnerEppn'],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
    }
];

const mockUserEventsForTrashSeriesForList = [
    {
        "metadata": [
            {
                "flavor": "dublincore/episode",
                "title": "EVENTS.EVENTS.DETAILS.CATALOG.EPISODE",
                "fields": [
                    {
                        "readOnly": false,
                        "id": "title",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.TITLE",
                        "type": "text",
                        "value": "alle sekunnin testilö.mp4",
                        "required": true
                    },
                    {
                        "readOnly": false,
                        "id": "subjects",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SUBJECT",
                        "type": "text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "description",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION",
                        "type": "text_long",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "language",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "rightsHolder",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.RIGHTS",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "license",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LICENSE",
                        "type": "ordered_text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "isPartOf",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SERIES",
                        "type": "text",
                        "value": "dee7b522-b547-4faa-93fe-04cdd92568ca",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "creator",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "contributor",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "startDate",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.START_DATE",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "duration",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DURATION",
                        "type": "text",
                        "value": "00:00:00",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "location",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LOCATION",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "source",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SOURCE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "created",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CREATED",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "publisher",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "identifier",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.ID",
                        "type": "text",
                        "value": "34a1a436-353b-40c7-805e-4d36c10ac89d",
                        "required": false
                    }
                ]
            }
        ],
        "description": "",
        "language": "",
        "source": "",
        "acl": [
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "read"
            },
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "write"
            }
        ],
        "title": 'TRASH EVENT 1',
        "duration": 0,
        "contributor": ['SeriesOwnerEppn'],
        "publication_status": [
            "internal",
            "engage-player",
            "api",
            "oaipmh-default"
        ],
        "identifier": CONSTANTS.TEST_TRASH_EVENT_1,
        "creator": "Opencast Project Administrator",
        "presenter": [],
        "created": "2021-10-12T14:11:00Z",
        "is_part_of": "dee7b522-b547-4faa-93fe-04cdd92568ca",
        "subjects": [],
        "start": "2021-10-12T14:11:00Z",
        "processing_state": "SUCCEEDED",
        "license": "",
        "archive_version": 3,
        "series": "inbox vmheikki",
        "has_previews": true,
        "location": "",
        "rightsholder": "",
        "status": "EVENTS.EVENTS.STATUS.PROCESSED",
        "publications": [
            {
                "metadata": [],
                "attachments": [],
                "channel": "engage-player",
                "id": "96dc60ad-9055-49ec-b5ea-de45cc8e3a3b",
                "media": [],
                "mediatype": "text/html",
                "url": "http://localhost:8080/engage/theodul/ui/core.html?id=34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [
                    {
                        "flavor": "dublincore/episode",
                        "size": -1,
                        "checksum": "",
                        "id": "0fed6a66-a71d-443e-ae08-018c226304a9",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a11af19-bb48-4f19-9a2d-a0c243e7c5ab/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "dublincore/series",
                        "size": -1,
                        "checksum": "3b4c7233b40e10bd3a7ce77ecf627b24 (md5)",
                        "id": "733c2a98-7480-4f71-8866-e3611622e1fd",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e256a56b-ffcb-48cf-b180-c816bd02d357/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    }
                ],
                "attachments": [
                    {
                        "flavor": "presenter/player+preview",
                        "ref": "",
                        "size": 0,
                        "checksum": "",
                        "id": "2b0bf337-abaa-4e0f-83ed-4994508f43ab",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a49daa5-31e7-45a0-879d-fdc0a34fc26f/coverimage.png",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/search+preview",
                        "ref": "track:cb53eb70-5e42-4eb6-a5f4-a7ec64ed84b4",
                        "size": 0,
                        "checksum": "",
                        "id": "c373c129-99df-4486-80de-0b483435d3e5",
                        "mediatype": "image/jpeg",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/9a429c50-031a-4904-bd13-e9141a0b8e16/alle_sekunnin_testilo__1_000s_search.jpg",
                        "tags": [
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/timeline+preview",
                        "ref": "track:track-4",
                        "size": 0,
                        "checksum": "",
                        "id": "cdc8b8b4-6a16-4b61-b57b-10dc2203631d",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e7dbd8bc-15d9-4b17-96fb-057a4673699a/alle_sekunnin_testilo__e9fa7cfb_3d10_44c5_a073_819f287f8e9d_timelinepreviews.png",
                        "tags": [
                            "engage-download"
                        ]
                    }
                ],
                "channel": "api",
                "id": "f0b4b9bc-46dc-4fef-80ae-5c23f2d6c326",
                "media": [
                    {
                        "has_audio": true,
                        "framerate": 25,
                        "description": "",
                        "bitrate": 220888,
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/3cbcb6e7-1d25-4cfa-ae79-6b220fde6966/alle_sekunnin_testilo_.mp4",
                        "has_video": true,
                        "tags": [
                            "720p-quality",
                            "engage-download",
                            "engage-streaming"
                        ],
                        "flavor": "presenter/delivery",
                        "duration": 1045,
                        "size": -1,
                        "framecount": 25,
                        "checksum": "6fdc0708a86963220c859546b95649f7 (md5)",
                        "width": 870,
                        "id": "33f776ce-bee8-4bfa-ae87-ea4a6949868b",
                        "mediatype": "video/mp4",
                        "height": 594
                    }
                ],
                "mediatype": "application/json",
                "url": "http://localhost:8080/api/events/34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "oaipmh-default",
                "id": "29f1a0ed-e294-4828-af47-7b244014c100",
                "media": [],
                "mediatype": "text/xml",
                "url": "/oaipmh/default?verb=ListMetadataFormats&identifier=34a1a436-353b-40c7-805e-4d36c10ac89d"
            }
        ]
    },
    {
        "metadata": [
            {
                "flavor": "dublincore/episode",
                "title": "EVENTS.EVENTS.DETAILS.CATALOG.EPISODE",
                "fields": [
                    {
                        "readOnly": false,
                        "id": "title",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.TITLE",
                        "type": "text",
                        "value": "alle sekunnin testilö.mp4",
                        "required": true
                    },
                    {
                        "readOnly": false,
                        "id": "subjects",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SUBJECT",
                        "type": "text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "description",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION",
                        "type": "text_long",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "language",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "rightsHolder",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.RIGHTS",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "license",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LICENSE",
                        "type": "ordered_text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "isPartOf",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SERIES",
                        "type": "text",
                        "value": "dee7b522-b547-4faa-93fe-04cdd92568ca",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "creator",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "contributor",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "startDate",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.START_DATE",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "duration",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DURATION",
                        "type": "text",
                        "value": "00:00:00",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "location",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LOCATION",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "source",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SOURCE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "created",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CREATED",
                        "type": "date",
                        "value": "2021-10-12T14:11:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "publisher",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "identifier",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.ID",
                        "type": "text",
                        "value": "34a1a436-353b-40c7-805e-4d36c10ac89d",
                        "required": false
                    }
                ]
            }
        ],
        "description": "",
        "language": "",
        "source": "",
        "acl": [
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "read"
            },
            {
                "allow": true,
                "role": "ROLE_USER_LATAAMO_TESTI",
                "action": "write"
            }
        ],
        "title": 'TRASH EVENT 2',
        "duration": 0,
        "contributor": ['SeriesOwnerEppn'],
        "publication_status": [
            "internal",
            "engage-player",
            "api",
            "oaipmh-default"
        ],
        "identifier": CONSTANTS.TEST_TRASH_EVENT_2,
        "creator": "Opencast Project Administrator",
        "presenter": [],
        "created": "2021-10-12T14:11:00Z",
        "is_part_of": "dee7b522-b547-4faa-93fe-04cdd92568ca",
        "subjects": [],
        "start": "2021-10-12T14:11:00Z",
        "processing_state": "SUCCEEDED",
        "license": "",
        "archive_version": 3,
        "series": "inbox vmheikki",
        "has_previews": true,
        "location": "",
        "rightsholder": "",
        "status": "EVENTS.EVENTS.STATUS.PROCESSED",
        "publications": [
            {
                "metadata": [],
                "attachments": [],
                "channel": "engage-player",
                "id": "96dc60ad-9055-49ec-b5ea-de45cc8e3a3b",
                "media": [],
                "mediatype": "text/html",
                "url": "http://localhost:8080/engage/theodul/ui/core.html?id=34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [
                    {
                        "flavor": "dublincore/episode",
                        "size": -1,
                        "checksum": "",
                        "id": "0fed6a66-a71d-443e-ae08-018c226304a9",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a11af19-bb48-4f19-9a2d-a0c243e7c5ab/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "dublincore/series",
                        "size": -1,
                        "checksum": "3b4c7233b40e10bd3a7ce77ecf627b24 (md5)",
                        "id": "733c2a98-7480-4f71-8866-e3611622e1fd",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e256a56b-ffcb-48cf-b180-c816bd02d357/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    }
                ],
                "attachments": [
                    {
                        "flavor": "presenter/player+preview",
                        "ref": "",
                        "size": 0,
                        "checksum": "",
                        "id": "2b0bf337-abaa-4e0f-83ed-4994508f43ab",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/5a49daa5-31e7-45a0-879d-fdc0a34fc26f/coverimage.png",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/search+preview",
                        "ref": "track:cb53eb70-5e42-4eb6-a5f4-a7ec64ed84b4",
                        "size": 0,
                        "checksum": "",
                        "id": "c373c129-99df-4486-80de-0b483435d3e5",
                        "mediatype": "image/jpeg",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/9a429c50-031a-4904-bd13-e9141a0b8e16/alle_sekunnin_testilo__1_000s_search.jpg",
                        "tags": [
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/timeline+preview",
                        "ref": "track:track-4",
                        "size": 0,
                        "checksum": "",
                        "id": "cdc8b8b4-6a16-4b61-b57b-10dc2203631d",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/e7dbd8bc-15d9-4b17-96fb-057a4673699a/alle_sekunnin_testilo__e9fa7cfb_3d10_44c5_a073_819f287f8e9d_timelinepreviews.png",
                        "tags": [
                            "engage-download"
                        ]
                    }
                ],
                "channel": "api",
                "id": "f0b4b9bc-46dc-4fef-80ae-5c23f2d6c326",
                "media": [
                    {
                        "has_audio": true,
                        "framerate": 25,
                        "description": "",
                        "bitrate": 220888,
                        "url": "http://localhost:8080/static/mh_default_org/api/34a1a436-353b-40c7-805e-4d36c10ac89d/3cbcb6e7-1d25-4cfa-ae79-6b220fde6966/alle_sekunnin_testilo_.mp4",
                        "has_video": true,
                        "tags": [
                            "720p-quality",
                            "engage-download",
                            "engage-streaming"
                        ],
                        "flavor": "presenter/delivery",
                        "duration": 1045,
                        "size": -1,
                        "framecount": 25,
                        "checksum": "6fdc0708a86963220c859546b95649f7 (md5)",
                        "width": 870,
                        "id": "33f776ce-bee8-4bfa-ae87-ea4a6949868b",
                        "mediatype": "video/mp4",
                        "height": 594
                    }
                ],
                "mediatype": "application/json",
                "url": "http://localhost:8080/api/events/34a1a436-353b-40c7-805e-4d36c10ac89d"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "oaipmh-default",
                "id": "29f1a0ed-e294-4828-af47-7b244014c100",
                "media": [],
                "mediatype": "text/xml",
                "url": "/oaipmh/default?verb=ListMetadataFormats&identifier=34a1a436-353b-40c7-805e-4d36c10ac89d"
            }
        ]
    }
];

const mockUserEventsForTrashSeries =  [
    {
        identifier: CONSTANTS.TEST_TRASH_EVENT_1,
        creator: 'Opencast Project Administrator',
        presenter: [],
        created: '2019-06-12T07:47:49Z',
        subjects: [ 'Trash' ],
        start: '2019-06-12T07:47:49Z',
        description: '',
        title: 'TRASH EVENT 1',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: [ 'SeriesOwnerEppn' ],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
    },
    {
        identifier: CONSTANTS.TEST_TRASH_EVENT_2,
        creator: 'Opencast Project Administrator',
        presenter: [],
        created: '2019-06-11T13:04:43Z',
        subjects: [ 'More trash' ],
        start: '2019-06-11T13:04:43Z',
        description: '',
        title: 'TRASH EVENT 2',
        processing_state: 'SUCCEEDED',
        duration: 0,
        archive_version: 7,
        contributor: ['SeriesOwnerEppn'],
        has_previews: true,
        location: '',
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ]
    }
];

const mockUserEvent1 = {
    'identifier': CONSTANTS.TEST_EVENT_1_ID,
    'creator': 'Lataamo Api User',
    'presenter': [],
    'created': '2019-10-28T09:03:00Z',
    'subjects': [],
    'start': '2019-10-28T09:03:00Z',
    'description': 'TEMPORARY DESCRIPTION, PLEASE UPDATE',
    'title': 'testivideo.mov',
    'processing_state': 'SUCCEEDED',
    'duration': '00:00:03',
    'archive_version': 10,
    'contributor': [],
    'has_previews': true,
    'location': '',
    'publication_status': [
        'internal',
        'engage-player',
        'api',
        'oaipmh-default'
    ],
    'isPartOf': '2803c188-e104-456b-8b6e-bf743dbbc158',
    'acls': [
        {
            'allow': true,
            'role': 'ROLE_USER_ADMIN',
            'action': 'read'
        },
        {
            'allow': true,
            'role': 'ROLE_USER_ADMIN',
            'action': 'write'
        },
        {
            'allow': true,
            'role': 'ROLE_ADMIN',
            'action': 'read'
        },
        {
            'allow': true,
            'role': 'ROLE_ADMIN',
            'action': 'write'
        }
    ],
    'visibility': [],
    'metadata': [
        {
            'flavor': 'dublincore/extra',
            'title': 'UniTube Event Extended Metadata',
            'fields': [
                {
                    'readOnly': false,
                    'id': 'order',
                    'label': 'Order',
                    'type': 'text',
                    'value': '',
                    'required': false
                }
            ]
        },
        {
            'flavor': 'dublincore/episode',
            'title': 'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE',
            'fields': [
                {
                    'readOnly': false,
                    'id': 'title',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.TITLE',
                    'type': 'text',
                    'value': 'testivideo.mov',
                    'required': true
                },
                {
                    'readOnly': false,
                    'id': 'subjects',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT',
                    'type': 'text',
                    'value': [],
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'description',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION',
                    'type': 'text_long',
                    'value': 'TEMPORARY DESCRIPTION, PLEASE UPDATE',
                    'required': false
                },
                {
                    'translatable': true,
                    'readOnly': false,
                    'id': 'language',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE',
                    'type': 'text',
                    'value': '',
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'rightsHolder',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS',
                    'type': 'text',
                    'value': '',
                    'required': false
                },
                {
                    'translatable': true,
                    'readOnly': false,
                    'id': 'license',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.LICENSE',
                    'type': 'text',
                    'value': 'ALLRIGHTS',
                    'required': false
                },
                {
                    'translatable': false,
                    'readOnly': false,
                    'id': 'isPartOf',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.SERIES',
                    'type': 'text',
                    'value': '2803c188-e104-456b-8b6e-bf743dbbc158',
                    'required': false
                },
                {
                    'translatable': false,
                    'readOnly': false,
                    'id': 'creator',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS',
                    'type': 'mixed_text',
                    'value': [],
                    'required': false
                },
                {
                    'translatable': false,
                    'readOnly': false,
                    'id': 'contributor',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS',
                    'type': 'mixed_text',
                    'value': [],
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'startDate',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.START_DATE',
                    'type': 'date',
                    'value': '2019-10-28',
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'startTime',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.START_TIME',
                    'type': 'time',
                    'value': '09:03',
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'duration',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.DURATION',
                    'type': 'text',
                    'value': '00:00:00',
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'location',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.LOCATION',
                    'type': 'text',
                    'value': '',
                    'required': false
                },
                {
                    'readOnly': false,
                    'id': 'source',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.SOURCE',
                    'type': 'text',
                    'value': '',
                    'required': false
                },
                {
                    'readOnly': true,
                    'id': 'created',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.CREATED',
                    'type': 'date',
                    'value': '2019-10-28T09:03:00.000Z',
                    'required': false
                },
                {
                    'readOnly': true,
                    'id': 'identifier',
                    'label': 'EVENTS.EVENTS.DETAILS.METADATA.ID',
                    'type': 'text',
                    'value': '4ce5ca78-aef5-451b-b123-08aa98e961a4',
                    'required': false
                }
            ]
        }
    ],
    'media': [
        {
            'mimetype': 'video/quicktime',
            'id': '70591e4f-d091-4ad1-b5e1-63eaf8cede18',
            'type': 'presenter/source',
            'url': 'http://opencast:8080/assets/assets/4ce5ca78-aef5-451b-b123-08aa98e961a4/70591e4f-d091-4ad1-b5e1-63eaf8cede18/10/testivideo.mov',
            'tags': [
                'archive'
            ]
        }
    ],
    'mediaFileMetadata': {
        'reference': '',
        'duration': 3157,
        'size': 4378335,
        'has_audio': true,
        'streams': {
            'audio': [
                {
                    'bitdepth': '',
                    'channels': 2,
                    'framecount': 131,
                    'rmspeakdb': '',
                    'bitrate': 306814,
                    'samplingrate': 44100,
                    'id': 'audio-1',
                    'type': 'AAC (Advanced Audio Coding)',
                    'rmsleveldb': '',
                    'peakleveldb': ''
                }
            ],
            'video': [
                {
                    'framecount': 95,
                    'scanorder': '',
                    'framerate': 30.090271,
                    'bitrate': 10788379,
                    'id': 'video-1',
                    'type': 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
                    'resolution': '1280x720',
                    'scantype': ''
                }
            ]
        },
        'checksum': 'fa2362f6d6e6b147d73397a71d4f86a3',
        'mimetype': 'video/quicktime',
        'id': '70591e4f-d091-4ad1-b5e1-63eaf8cede18',
        'type': 'presenter/source',
        'url': 'http://opencast:8080/assets/assets/4ce5ca78-aef5-451b-b123-08aa98e961a4/70591e4f-d091-4ad1-b5e1-63eaf8cede18/10/testivideo.mov',
        'has_video': true,
        'tags': [
            'archive'
        ]
    },
    'license': 'ALLRIGHTS',
    'licenses': [
        'ALLRIGHTS',
        'CC-BY',
        'CC-BY-SA',
        'CC-BY-ND',
        'CC-BY-NC',
        'CC-BY-NC-SA',
        'CC-BY-NC-ND',
        'CC0'
    ]
};

const mockNewUserEventsForSeries1 = [
    {
        "metadata": [
            {
                "flavor": "dublincore/episode",
                "title": "EVENTS.EVENTS.DETAILS.CATALOG.EPISODE",
                "fields": [
                    {
                        "readOnly": false,
                        "id": "title",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.TITLE",
                        "type": "text",
                        "value": "pienivideo.mp4",
                        "required": true
                    },
                    {
                        "readOnly": false,
                        "id": "subjects",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SUBJECT",
                        "type": "text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "description",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION",
                        "type": "text_long",
                        "value": "jjjj",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "language",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "rightsHolder",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.RIGHTS",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "license",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LICENSE",
                        "type": "ordered_text",
                        "value": "UNITUBE-ALLRIGHTS",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "isPartOf",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SERIES",
                        "type": "text",
                        "value": "4c90e2c8-6846-42d6-b4d3-201d64a1fff4",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "creator",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "contributor",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "startDate",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.START_DATE",
                        "type": "date",
                        "value": "2021-08-24T10:31:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "duration",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DURATION",
                        "type": "text",
                        "value": "00:00:00",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "location",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LOCATION",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "source",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SOURCE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "created",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CREATED",
                        "type": "date",
                        "value": "2021-08-24T10:31:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "publisher",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "identifier",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.ID",
                        "type": "text",
                        "value": "4a0dfe03-361c-41d5-8df9-47f488639e93",
                        "required": false
                    }
                ]
            }
        ],
        "description": "jjjj",
        "language": "",
        "source": "",
        "acl": [
            {
                "allow": true,
                "role": "ROLE_ANONYMOUS",
                "action": "read"
            },
            {
                "allow": true,
                "role": "ROLE_KATSOMO",
                "action": "write"
            }
        ],
        "title": "pienivideo.mp4",
        "duration": 0,
        "contributor": [],
        "publication_status": [
            "internal",
            "api",
            "oaipmh-default",
            "engage-player"
        ],
        "identifier": CONSTANTS.TEST_EVENT_1_ID,
        "creator": "lataamo testi",
        "presenter": [],
        "created": "2021-08-24T10:31:00Z",
        "is_part_of": "4c90e2c8-6846-42d6-b4d3-201d64a1fff4",
        "subjects": [],
        "start": "2021-08-24T10:31:00Z",
        "processing_state": "SUCCEEDED",
        "license": "UNITUBE-ALLRIGHTS",
        "archive_version": 4,
        "series": "julkinen sarja",
        "has_previews": true,
        "location": "",
        "rightsholder": "",
        "status": "EVENTS.EVENTS.STATUS.PROCESSED",
        "publications": [
            {
                "metadata": [
                    {
                        "flavor": "dublincore/series",
                        "size": -1,
                        "checksum": "3b4c7233b40e10bd3a7ce77ecf627b24 (md5)",
                        "id": "b3981f74-309b-4b15-9b01-bcfaa5d0436a",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/ee87642f-8869-4fd9-8ac4-5ca3ffe7358b/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "dublincore/episode",
                        "size": -1,
                        "checksum": "",
                        "id": "32c6fbcd-62ec-466f-8d99-588f084c7bd7",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/332b9e18-8684-4aba-baaa-23bc2d5c0ef6/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    }
                ],
                "attachments": [
                    {
                        "flavor": "presenter/player preview",
                        "ref": "",
                        "size": 0,
                        "checksum": "",
                        "id": "fca12109-aaf9-400e-bdd0-54ea56d99c76",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/3ec93c98-7c33-441d-b482-ed6b3d9fe42b/coverimage.png",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/timeline preview",
                        "ref": "track:track-4",
                        "size": 0,
                        "checksum": "",
                        "id": "3e560268-864e-4ae9-a5f3-791ec22d98d4",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/3ecf2e3f-9c33-43f7-8588-d3b1bd2fcc7e/pienivideo_7ebe3766_7a16_40f3_a192_45c230fd5c7f_timelinepreviews.png",
                        "tags": [
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/search preview",
                        "ref": "track:d86431c7-1cf0-45ca-8e40-112965f7e854",
                        "size": 0,
                        "checksum": "",
                        "id": "633c90e9-de2a-4295-bb67-44f8d20704fd",
                        "mediatype": "image/jpeg",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/39da5b9b-8f82-4f2e-927b-a5eda36b6a25/pienivideo_1_000s_search.jpg",
                        "tags": [
                            "engage-download"
                        ]
                    }
                ],
                "channel": "api",
                "id": "6ac5d9fd-057e-45df-a9d3-be5b28dc2882",
                "media": [
                    {
                        "has_audio": true,
                        "framerate": 25,
                        "description": "",
                        "bitrate": 819882,
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/db17fd67-86d9-4798-b276-8e4edafce3ec/pienivideo.mp4",
                        "has_video": true,
                        "tags": [
                            "720p-quality",
                            "engage-download",
                            "engage-streaming"
                        ],
                        "flavor": "presenter/delivery",
                        "duration": 5880,
                        "size": -1,
                        "framecount": 147,
                        "checksum": "3aaf8daac146b2c1e74c2cc2588e4b4b (md5)",
                        "width": 406,
                        "id": "f3c8357f-4c8b-480e-b36c-55f032b602bd",
                        "mediatype": "video/mp4",
                        "height": 720
                    }
                ],
                "mediatype": "application/json",
                "url": "http://localhost:8080/api/events/4a0dfe03-361c-41d5-8df9-47f488639e93"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "oaipmh-default",
                "id": "e9c41c47-1c2f-4903-a9f5-c1d457264a07",
                "media": [],
                "mediatype": "text/xml",
                "url": "/oaipmh/default?verb=ListMetadataFormats&identifier=4a0dfe03-361c-41d5-8df9-47f488639e93"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "engage-player",
                "id": "36aa5937-0e63-4198-a583-862e415b6675",
                "media": [],
                "mediatype": "text/html",
                "url": "http://localhost:8080/engage/theodul/ui/core.html?id=4a0dfe03-361c-41d5-8df9-47f488639e93"
            }
        ]
    }
];


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
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ],
        isPartOf: CONSTANTS.TEST_SERIES_1_ID
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
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ],
        isPartOf: CONSTANTS.TEST_SERIES_1_ID
    }
];

const mockNewUserEventsForSeries2 = [
    {
        "metadata": [
            {
                "flavor": "dublincore/episode",
                "title": "EVENTS.EVENTS.DETAILS.CATALOG.EPISODE",
                "fields": [
                    {
                        "readOnly": false,
                        "id": "title",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.TITLE",
                        "type": "text",
                        "value": "pienivideo.mp4",
                        "required": true
                    },
                    {
                        "readOnly": false,
                        "id": "subjects",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SUBJECT",
                        "type": "text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "description",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION",
                        "type": "text_long",
                        "value": "jjjj",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "language",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "rightsHolder",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.RIGHTS",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "translatable": true,
                        "readOnly": false,
                        "id": "license",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LICENSE",
                        "type": "ordered_text",
                        "value": "UNITUBE-ALLRIGHTS",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "isPartOf",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SERIES",
                        "type": "text",
                        "value": "4c90e2c8-6846-42d6-b4d3-201d64a1fff4",
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "creator",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "translatable": false,
                        "readOnly": false,
                        "id": "contributor",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS",
                        "type": "mixed_text",
                        "value": [],
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "startDate",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.START_DATE",
                        "type": "date",
                        "value": "2021-08-24T10:31:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "duration",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.DURATION",
                        "type": "text",
                        "value": "00:00:00",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "location",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.LOCATION",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": false,
                        "id": "source",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.SOURCE",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "created",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.CREATED",
                        "type": "date",
                        "value": "2021-08-24T10:31:00.000Z",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "publisher",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.PUBLISHER",
                        "type": "text",
                        "value": "",
                        "required": false
                    },
                    {
                        "readOnly": true,
                        "id": "identifier",
                        "label": "EVENTS.EVENTS.DETAILS.METADATA.ID",
                        "type": "text",
                        "value": "4a0dfe03-361c-41d5-8df9-47f488639e93",
                        "required": false
                    }
                ]
            }
        ],
        "description": "jjjj",
        "language": "",
        "source": "",
        "acl": [
            {
                "allow": true,
                "role": "ROLE_ANONYMOUS",
                "action": "read"
            },
            {
                "allow": true,
                "role": "ROLE_KATSOMO",
                "action": "write"
            }
        ],
        "title": "pienivideo.mp4",
        "duration": 0,
        "contributor": [],
        "publication_status": [
            "internal",
            "api",
            "oaipmh-default",
            "engage-player"
        ],
        "identifier": CONSTANTS.TEST_EVENT_2_ID,
        "creator": "lataamo testi",
        "presenter": [],
        "created": "2021-08-24T10:31:00Z",
        "is_part_of": "4c90e2c8-6846-42d6-b4d3-201d64a1fff4",
        "subjects": [],
        "start": "2021-08-24T10:31:00Z",
        "processing_state": "SUCCEEDED",
        "license": "UNITUBE-ALLRIGHTS",
        "archive_version": 4,
        "series": "julkinen sarja",
        "has_previews": true,
        "location": "",
        "rightsholder": "",
        "status": "EVENTS.EVENTS.STATUS.PROCESSED",
        "publications": [
            {
                "metadata": [
                    {
                        "flavor": "dublincore/series",
                        "size": -1,
                        "checksum": "3b4c7233b40e10bd3a7ce77ecf627b24 (md5)",
                        "id": "b3981f74-309b-4b15-9b01-bcfaa5d0436a",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/ee87642f-8869-4fd9-8ac4-5ca3ffe7358b/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "dublincore/episode",
                        "size": -1,
                        "checksum": "",
                        "id": "32c6fbcd-62ec-466f-8d99-588f084c7bd7",
                        "mediatype": "text/xml",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/332b9e18-8684-4aba-baaa-23bc2d5c0ef6/dublincore.xml",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    }
                ],
                "attachments": [
                    {
                        "flavor": "presenter/player preview",
                        "ref": "",
                        "size": 0,
                        "checksum": "",
                        "id": "fca12109-aaf9-400e-bdd0-54ea56d99c76",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/3ec93c98-7c33-441d-b482-ed6b3d9fe42b/coverimage.png",
                        "tags": [
                            "archive",
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/timeline preview",
                        "ref": "track:track-4",
                        "size": 0,
                        "checksum": "",
                        "id": "3e560268-864e-4ae9-a5f3-791ec22d98d4",
                        "mediatype": "image/png",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/3ecf2e3f-9c33-43f7-8588-d3b1bd2fcc7e/pienivideo_7ebe3766_7a16_40f3_a192_45c230fd5c7f_timelinepreviews.png",
                        "tags": [
                            "engage-download"
                        ]
                    },
                    {
                        "flavor": "presenter/search preview",
                        "ref": "track:d86431c7-1cf0-45ca-8e40-112965f7e854",
                        "size": 0,
                        "checksum": "",
                        "id": "633c90e9-de2a-4295-bb67-44f8d20704fd",
                        "mediatype": "image/jpeg",
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/39da5b9b-8f82-4f2e-927b-a5eda36b6a25/pienivideo_1_000s_search.jpg",
                        "tags": [
                            "engage-download"
                        ]
                    }
                ],
                "channel": "api",
                "id": "6ac5d9fd-057e-45df-a9d3-be5b28dc2882",
                "media": [
                    {
                        "has_audio": true,
                        "framerate": 25,
                        "description": "",
                        "bitrate": 819882,
                        "url": "http://localhost:8080/static/mh_default_org/api/4a0dfe03-361c-41d5-8df9-47f488639e93/db17fd67-86d9-4798-b276-8e4edafce3ec/pienivideo.mp4",
                        "has_video": true,
                        "tags": [
                            "720p-quality",
                            "engage-download",
                            "engage-streaming"
                        ],
                        "flavor": "presenter/delivery",
                        "duration": 5880,
                        "size": -1,
                        "framecount": 147,
                        "checksum": "3aaf8daac146b2c1e74c2cc2588e4b4b (md5)",
                        "width": 406,
                        "id": "f3c8357f-4c8b-480e-b36c-55f032b602bd",
                        "mediatype": "video/mp4",
                        "height": 720
                    }
                ],
                "mediatype": "application/json",
                "url": "http://localhost:8080/api/events/4a0dfe03-361c-41d5-8df9-47f488639e93"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "oaipmh-default",
                "id": "e9c41c47-1c2f-4903-a9f5-c1d457264a07",
                "media": [],
                "mediatype": "text/xml",
                "url": "/oaipmh/default?verb=ListMetadataFormats&identifier=4a0dfe03-361c-41d5-8df9-47f488639e93"
            },
            {
                "metadata": [],
                "attachments": [],
                "channel": "engage-player",
                "id": "36aa5937-0e63-4198-a583-862e415b6675",
                "media": [],
                "mediatype": "text/html",
                "url": "http://localhost:8080/engage/theodul/ui/core.html?id=4a0dfe03-361c-41d5-8df9-47f488639e93"
            }
        ]
    }
];

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
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ],
        isPartOf: CONSTANTS.TEST_SERIES_2_ID
    }
];

const mockUserEventsForSeries3 =  [
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
        publication_status: [ 'internal', 'engage-player', 'api', 'oaipmh-default' ],
        isPartOf: CONSTANTS.TEST_SERIES_3_ID
    }
];
// /api/series/3f9ff5b-7663-54b7-b7cf-950be665de3c/acl
const inboxEventAclsFromSeries = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/series/${CONSTANTS.TEST_INBOX_SERIES_ID}/acl`)
    .reply(200, inboxEventACLs).persist(); // this url will be called several times so let's persist

// /api/series/3f9ff5b-7663-54b7-b7cf-950be665de3c/acl
const trashEventAclsFromSeries = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/series/${CONSTANTS.TEST_TRASH_SERIES_ID}/acl`)
    .reply(200, trashEventACLs).persist(); // this url will be called several times so let's persist

// /api/series/80f9ff5b-4163-48b7-b7cf-950be665de3c/acl
const eventAclsFromSeries = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/series/${CONSTANTS.TEST_SERIES_1_ID}/acl`)
    .reply(200, eventACLs).persist(); // this url will be called several times so let's persist

const inboxEventACLs = [
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_ADMIN', action: 'write' },
];

const trashEventACLs = [
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_ADMIN', action: 'write' },
];

const eventACLs =  [
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ANONYMOUS', action: 'read' }
];

// /api/series/d72a8c9e-f854-4ba4-9ed2-89405fae214e/acl
const eventAclsFromSerie2 = () => {
    return nock(CONSTANTS.OCAST_BASE_URL)
        .get(`/api/series/${CONSTANTS.TEST_SERIES_2_ID}/acl`)
        .reply(200, event2ACLs).persist(); // this url will be called several times so let's persist
};

const event2ACLs =  [
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ANONYMOUS', action: 'read' },
    { allow: true, role: '123_Instructor', action: 'read' },
    { allow: true, role: '123_Learner', action: 'read' },
];

const eventAclsFromSerie3 = () => {
    return nock(CONSTANTS.OCAST_BASE_URL)
        .get(`/api/series/${CONSTANTS.TEST_SERIES_3_ID}/acl`)
        .reply(200, event3ACLs).persist(); // this url will be called several times so let's persist
};

const event3ACLs =  [
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_USER_ADMIN', action: 'write' },
    { allow: true, role: 'ROLE_ADMIN', action: 'read' },
    { allow: true, role: 'ROLE_ADMIN', action: 'write' },
];


//    /admin-ng/event/11111/asset/media/media.json
const event1InboxMediaMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_INBOX_EVENT_1}/asset/media/media.json`)
    .reply(200, mediaInboxMetadata1);

//    /admin-ng/event/2222/asset/media/media.json
const event2InboxMediaMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_INBOX_EVENT_2}/asset/media/media.json`)
    .reply(200, mediaInboxMetadata2);

//    /admin-ng/event/3333/asset/media/media.json
const event1TrashMediaMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_TRASH_EVENT_1}/asset/media/media.json`)
    .reply(200, mediaTrashMetadata1);

//    /admin-ng/event/4444/asset/media/media.json
const event2TrashMediaMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_TRASH_EVENT_2}/asset/media/media.json`)
    .reply(200, mediaTrashMetadata2);

// /admin-ng/event/11111/asset/media/333333.json
const event1InboxMediaFileMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_INBOX_EVENT_1}/asset/media/${CONSTANTS.TEST_MEDIA_1_INBOX_METADATA_ID}.json`)
    .reply(200, mediaInboxMetadataFile1);

// /admin-ng/event/22222/asset/media/44444.json
const event2InboxMediaFileMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_INBOX_EVENT_2}/asset/media/${CONSTANTS.TEST_MEDIA_2_INBOX_METADATA_ID}.json`)
    .reply(200, mediaInboxMetadataFile2);

// /admin-ng/event/3333/asset/media/333333.json
const event1TrashMediaFileMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_TRASH_EVENT_1}/asset/media/${CONSTANTS.TEST_MEDIA_1_TRASH_METADATA_ID}.json`)
    .reply(200, mediaTrashMetadataFile1);

// /admin-ng/event/4444/asset/media/44444.json
const event2TrashMediaFileMetadata = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_TRASH_EVENT_2}/asset/media/${CONSTANTS.TEST_MEDIA_2_TRASH_METADATA_ID}.json`)
    .reply(200, mediaTrashMetadataFile2);


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


const mediaInboxMetadata1 = [
    {
        mimetype: 'video/mp4',
        id: CONSTANTS.TEST_MEDIA_1_INBOX_METADATA_ID,
        type: 'presenter/source',
        url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_INBOX_EVENT_1}/${CONSTANTS.TEST_MEDIA_1_INBOX_METADATA_ID}/7/fruits_on_table.mp4`,
        tags: [ 'archive' ]
    }
];

const mediaInboxMetadata2 = [
    {
        mimetype: 'video/mp4',
        id: CONSTANTS.TEST_MEDIA_2_INBOX_METADATA_ID,
        type: 'presenter/source',
        url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_INBOX_EVENT_2}/${CONSTANTS.TEST_MEDIA_2_INBOX_METADATA_ID}/7/fruits_on_table.mp4`,
        tags: [ 'archive' ]
    }
];

const mediaTrashMetadata1 = [
    {
        mimetype: 'video/mp4',
        id: CONSTANTS.TEST_MEDIA_1_TRASH_METADATA_ID,
        type: 'presenter/source',
        url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_TRASH_EVENT_1}/${CONSTANTS.TEST_MEDIA_1_TRASH_METADATA_ID}/7/fruits_on_table.mp4`,
        tags: [ 'archive' ]
    }
];

const mediaTrashMetadata2 = [
    {
        mimetype: 'video/mp4',
        id: CONSTANTS.TEST_MEDIA_2_TRASH_METADATA_ID,
        type: 'presenter/source',
        url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_TRASH_EVENT_2}/${CONSTANTS.TEST_MEDIA_2_TRASH_METADATA_ID}/7/fruits_on_table.mp4`,
        tags: [ 'archive' ]
    }
];

const mediaInboxMetadataFile1 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: [ [Object] ], video: [ [Object] ] },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: '5c8ab233-6710-49f7-935d-fa6b7f733dce',
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_INBOX_EVENT_1}/${CONSTANTS.TEST_MEDIA_1_INBOX_METADATA_ID}/3/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
};


const mediaInboxMetadataFile2 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: [ [Object] ], video: [ [Object] ] },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: '5c8ab233-6710-49f7-935d-fa6b7f733dce',
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_INBOX_EVENT_2}/${CONSTANTS.TEST_MEDIA_2_INBOX_METADATA_ID}/3/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
};

const mediaTrashMetadataFile1 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: [ [Object] ], video: [ [Object] ] },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: '5c8ab233-6710-49f7-935d-fa6b7f733dce',
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_TRASH_EVENT_1}/${CONSTANTS.TEST_MEDIA_1_TRASH_METADATA_ID}/3/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
};


const mediaTrashMetadataFile2 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: [ [Object] ], video: [ [Object] ] },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: '5c8ab233-6710-49f7-935d-fa6b7f733dce',
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_TRASH_EVENT_2}/${CONSTANTS.TEST_MEDIA_2_TRASH_METADATA_ID}/3/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
};

const mediaMetadata1 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: 'the file', video: 'the file' },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_1_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_1_ID}/${CONSTANTS.TEST_MEDIA_1_METADATA_ID}/7/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
};

const mediaMetadata2 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: 'the file', video: 'the file' },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_2_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_2_ID}/${CONSTANTS.TEST_MEDIA_2_METADATA_ID}/7/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
};

const mediaMetadata3 = {
    reference: '',
    duration: 14721,
    size: 38321839,
    has_audio: true,
    streams: { audio: 'the file', video: 'the file' },
    checksum: 'bcdcde376469378a034c2e0dad33e497',
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_3_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_3_ID}/${CONSTANTS.TEST_MEDIA_3_METADATA_ID}/7/fruits_on_table.mp4`,
    has_video: true,
    tags: [ 'archive' ]
};

const mockMediaData2 = [ {
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_2_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_2_ID}/${CONSTANTS.TEST_MEDIA_2_METADATA_ID}/7/fruits_on_table.mp4`,
    tags: [ 'archive' ]
}];

const mockMediaData1 = [{
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_1_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_1_ID}/${CONSTANTS.TEST_MEDIA_1_METADATA_ID}/7/fruits_on_table.mp4`,
    tags: [ 'archive' ]
}];

const mockMediaData3 = [ {
    mimetype: 'video/mp4',
    id: CONSTANTS.TEST_MEDIA_3_METADATA_ID,
    type: 'presenter/source',
    url: `http://opencast:8080/assets/assets/${CONSTANTS.TEST_EVENT_3_ID}/${CONSTANTS.TEST_MEDIA_3_METADATA_ID}/7/fruits_on_table.mp4`,
    tags: [ 'archive' ]
}];

const mockEventPublicationContainsOneVideoWithDifferentQualities = [
    {
        'metadata': [
            {
                'flavor': 'dublincore/episode',
                'size': -1,
                'checksum': '',
                'id': 'bef7ab89-6384-4387-a30f-38e430d2a789',
                'mediatype': 'text/xml',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/e38f99c5-95b1-4463-993b-f0152f3dbfe6/dublincore.xml',
                'tags': [
                    'archive',
                    'engage-download'
                ]
            }
        ],
        'attachments': [
            {
                'flavor': 'presenter/timeline+preview',
                'ref': 'track:track-4',
                'size': 0,
                'checksum': '',
                'id': 'bc7cab02-f1e9-4ff0-9c55-65e3f7126e51',
                'mediatype': 'image/png',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/192ed5dc-bb0e-4212-b17e-4f88387ec326/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo_d3b10943_7dd7_49cd_a631_51b156f6d52b_timelinepreviews.png',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presenter/search+preview',
                'ref': 'track:track-4',
                'size': 0,
                'checksum': '',
                'id': '50b981e6-50bd-4631-8548-c8afce001605',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/attachment-4/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo_1_000s_search.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presenter/player+preview',
                'ref': '',
                'size': 0,
                'checksum': '',
                'id': 'cfb658a3-5a27-4cb5-a770-98a8826a19cd',
                'mediatype': 'image/png',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/eceae139-c3f4-472f-a88a-8f936dd984d3/coverimage.png',
                'tags': [
                    'archive',
                    'engage-download'
                ]
            }
        ],
        'channel': 'engage-player',
        'id': 'cd5695db-e95f-4075-bd31-33f3bb00082d',
        'media': [
            {
                'has_audio': true,
                'framerate': 25,
                'description': '',
                'bitrate': 3649883,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/f34bf97f-a738-46e9-9455-c8dd11b53409/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo.mp4',
                'has_video': true,
                'tags': [
                    '1080p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presenter/delivery',
                'duration': 197718,
                'size': -1,
                'framecount': 4942,
                'checksum': 'cf3b5aa22086267c55bce251aec5eae1 (md5)',
                'width': 1920,
                'id': '0aaf082c-e957-4a61-be5e-7af6ffc51f41',
                'mediatype': 'video/mp4',
                'height': 1080
            },
            {
                'has_audio': true,
                'framerate': 25,
                'description': '',
                'bitrate': 761223,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/baea7d32-5250-450b-8dea-65140e7510ab/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo.mp4',
                'has_video': true,
                'tags': [
                    '480p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presenter/delivery',
                'duration': 197718,
                'size': -1,
                'framecount': 4942,
                'checksum': 'cb68ebee7741d8034c690790cf5818b2 (md5)',
                'width': 854,
                'id': 'b9727971-538b-47ce-b23b-5aefe9e1ea53',
                'mediatype': 'video/mp4',
                'height': 480
            },
            {
                'has_audio': true,
                'framerate': 25,
                'description': '',
                'bitrate': 1189756,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/73f316a5-e0e1-4b7b-99f8-711561a5ccbb/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo.mp4',
                'has_video': true,
                'tags': [
                    '720p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presenter/delivery',
                'duration': 197718,
                'size': -1,
                'framecount': 4942,
                'checksum': 'bf72fd03fcf7f7d6ce0ed6932711575b (md5)',
                'width': 1280,
                'id': '0dfd992a-fd9c-47b2-b4b9-3da91251ba0f',
                'mediatype': 'video/mp4',
                'height': 720
            },
            {
                'has_audio': true,
                'framerate': 25,
                'description': '',
                'bitrate': 9341107,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/a9f5e413-1dcc-4832-a750-251a16893b2f/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo.mp4',
                'has_video': true,
                'tags': [
                    '2160p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presenter/delivery',
                'duration': 197718,
                'size': -1,
                'framecount': 4942,
                'checksum': 'f44509f90bcb2f541aa84af04263126c (md5)',
                'width': 3840,
                'id': '418c2b84-5411-481d-b6dc-8f5875f69676',
                'mediatype': 'video/mp4',
                'height': 2160
            },
            {
                'has_audio': true,
                'framerate': 25,
                'description': '',
                'bitrate': 338559,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/b419f01d-c203-4610-a1d4-a4b8904083d4/4ca88688-247e-4a6a-9787-2b1cee960c25/Samsung_and_RedBull_See_the_Unexpected_HDR_UHD_4K_Demo.mp4',
                'has_video': true,
                'tags': [
                    '360p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presenter/delivery',
                'duration': 197718,
                'size': -1,
                'framecount': 4942,
                'checksum': '658770e01eefaba5fd32f0303a571d72 (md5)',
                'width': 640,
                'id': 'c56b3530-8257-4ec5-9964-c14b9770b997',
                'mediatype': 'video/mp4',
                'height': 360
            }
        ],
        'mediatype': 'application/json',
        'url': 'http://ocast-devel-a1.it.helsinki.fi/api/events/b419f01d-c203-4610-a1d4-a4b8904083d4'
    },
    {
        'metadata': [],
        'attachments': [],
        'channel': 'oaipmh-default',
        'id': 'f44c5529-94dc-46c2-8281-1c1b4ce6afd5',
        'media': [],
        'mediatype': 'text/xml',
        'url': 'https://ocast-devel-i1.it.helsinki.fi/oaipmh/default?verb=ListMetadataFormats&identifier=b419f01d-c203-4610-a1d4-a4b8904083d4'
    },
    {
        'metadata': [],
        'attachments': [],
        'channel': 'engage-player',
        'id': 'bf500480-af9a-49ce-90cb-56308c8fa441',
        'media': [],
        'mediatype': 'text/html',
        'url': 'https://ocast-devel-i1.it.helsinki.fi/engage/theodul/ui/core.html?id=b419f01d-c203-4610-a1d4-a4b8904083d4'
    }
];

const mockEventPublicationsEmpty = [];

const mockEvent1VttFile = 'WEBVTT\n' +
    '\n' +
    '00:00:00.500 --> 00:00:02.000\n' +
    'The Web is always changing\n' +
    '\n' +
    '00:00:02.500 --> 00:00:04.300\n' +
    'and the way we access it is changing';

const mockEventPublicationContainsTwoVideosWithDifferentQualities = [
    {
        'metadata': [
            {
                'flavor': 'dublincore/episode',
                'size': -1,
                'checksum': '',
                'id': 'f40cac8b-e609-4290-9d22-c8d56a39f46e',
                'mediatype': 'text/xml',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/5ac68576-826d-4933-a1bc-9569ef577e4c/dublincore.xml',
                'tags': [
                    'archive',
                    'engage-download'
                ]
            },
            {
                'flavor': 'mpeg-7/text',
                'size': -1,
                'checksum': '',
                'id': '3a92269b-16c2-40fe-97ea-cd7d6c45a100',
                'mediatype': 'text/xml',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/ac05d9e9-8df2-4e17-ac5d-12c087ca0619/slidetext.xml',
                'tags': [
                    'engage-download'
                ]
            }
        ],
        'attachments': [
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:28:107F1000',
                'size': 0,
                'checksum': '',
                'id': '345390e8-ef6b-489a-a4fd-94cedec48861',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/776f27b5-adfa-4128-98f9-4404d404ff23/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:13:533F1000',
                'size': 0,
                'checksum': '',
                'id': '076abf29-e2a1-4805-8c23-cbccdb419c28',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/85a11590-b32a-4ae2-a17a-14d9213e7de5/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:15:615F1000',
                'size': 0,
                'checksum': '',
                'id': '31d0513b-8d7d-48b1-9f94-23d455cab965',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/3ea6eb38-fe59-4d23-af3e-e5555ffe903e/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:08:328F1000',
                'size': 0,
                'checksum': '',
                'id': '8afb2d06-1083-431b-a512-6f03f482d3b7',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/2a3ccb2b-a50d-4730-9843-d5e569c4cbda/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:27:66F1000',
                'size': 0,
                'checksum': '',
                'id': '2ead09d5-bfed-43ab-ae0b-ff06fb79ff7c',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/8c2e101c-1326-4a2b-93a7-c21850255bd7/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:18:738F1000',
                'size': 0,
                'checksum': '',
                'id': 'a82ace81-820c-410c-9971-f7f548a2b0f7',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/00490562-5d33-4e50-b6c4-204d94956d02/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presenter/search+preview',
                'ref': 'track:track-6',
                'size': 0,
                'checksum': '',
                'id': '887d243b-d138-4cc4-a124-1ac90345ac5f',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/attachment-3/SHOT4_4K_CC_injected_1_000s_search.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:29:148F1000',
                'size': 0,
                'checksum': '',
                'id': 'aa5cfe55-8950-4302-abea-20b766b2d8e8',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/22992f2d-4820-4b2a-9720-1b35d9b11be2/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:01:41F1000',
                'size': 0,
                'checksum': '',
                'id': '92755f3c-baf3-4cc3-bd07-d2d417f25267',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/979da9da-1190-4e17-b6e3-d04982b7e8a9/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:22:902F1000',
                'size': 0,
                'checksum': '',
                'id': '0db72fa3-8584-4158-b315-be8f87913386',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/c8fa4bfd-c179-49ac-a160-98b97cb0e333/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:00:0F1000',
                'size': 0,
                'checksum': '',
                'id': 'a320b3ea-95db-42e8-afdf-9346a5767dbe',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/a81bce0d-dd22-44ad-b520-e33220e73702/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:16:656F1000',
                'size': 0,
                'checksum': '',
                'id': '6b8bd145-ee59-42a7-bea8-8555123322f7',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/a4818999-0cc9-4a7d-bd53-a6ffe1acec83/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/player+preview',
                'ref': 'track:track-7',
                'size': 0,
                'checksum': '',
                'id': 'fc4fb8ef-907a-46ac-82db-e0c0dbc1640d',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/attachment-6/SHOT4_4K_CC_injected_1_000s_player.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:03:123F1000',
                'size': 0,
                'checksum': '',
                'id': '86ebddfa-e46d-4415-afe1-63e2b009dde7',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/efdf095d-1621-423c-9933-fc31d6e750de/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/search+preview',
                'ref': 'track:track-7',
                'size': 0,
                'checksum': '',
                'id': 'd31d42ea-93f0-455b-8367-bb8894c632ff',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/attachment-4/SHOT4_4K_CC_injected_1_000s_search.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:06:246F1000',
                'size': 0,
                'checksum': '',
                'id': '8a2bda62-73dd-4de5-89d6-84df1a9a6503',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/ca974358-0cb0-4f43-a390-d3bcdf6e4a13/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/timeline+preview',
                'ref': 'track:track-7',
                'size': 0,
                'checksum': '',
                'id': 'a0987445-d0a8-48df-bef7-82014c7e0a89',
                'mediatype': 'image/png',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/3ae5cd5d-a779-471d-9898-086d0bc316bf/SHOT4_4K_CC_injected_52c84d12_f4e3_4301_b7f3_6cbb073921fe_timelinepreviews.png',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:11:451F1000',
                'size': 0,
                'checksum': '',
                'id': 'b5233a0d-8ac5-4838-95ab-058a6f79e1f3',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/47c8b7dc-88cf-47f9-b05b-18d41eeba7cb/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:23:943F1000',
                'size': 0,
                'checksum': '',
                'id': 'acc04fca-71be-43ab-9ac8-09a9aa0f16d0',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/3981b811-788c-42f1-96cd-e98980b61ada/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:04:164F1000',
                'size': 0,
                'checksum': '',
                'id': '6fcf2db2-bde7-47b0-b5b3-441839a294ad',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/283aeb19-73db-435d-aba4-ce69ba857cfb/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presenter/player+preview',
                'ref': '',
                'size': 0,
                'checksum': '',
                'id': '378fd651-5e19-41a3-99fd-50405c2362c4',
                'mediatype': 'image/png',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/6b20193e-d116-45b4-8490-4a2f02e34613/coverimage.png',
                'tags': [
                    'archive',
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:24:984F1000',
                'size': 0,
                'checksum': '',
                'id': '661c6717-7c3c-489a-a39d-ec9cab749bbe',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/5a239f57-4b7a-4063-8476-13a3e4b67e8b/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:19:779F1000',
                'size': 0,
                'checksum': '',
                'id': '789f2beb-ef76-4129-9a95-6630d098377e',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/07e9fafe-241f-4ff8-bc88-46a6943ee783/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:05:205F1000',
                'size': 0,
                'checksum': '',
                'id': '53468ba8-e9ad-4f4b-bdff-124cee969d91',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/672c063d-c92f-43d7-a3a8-3793d58e3019/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:17:697F1000',
                'size': 0,
                'checksum': '',
                'id': '311c5a5f-1643-410e-b784-ae5a3111b684',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/983b4a93-f758-46e9-84aa-92b99eec62f0/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:12:492F1000',
                'size': 0,
                'checksum': '',
                'id': 'fa3ed5a2-1d65-4eaf-82f5-d1aebb2425da',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/b6dbbe4e-8c29-4d4e-ae7c-50548c054160/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:30:189F1000',
                'size': 0,
                'checksum': '',
                'id': '149a6129-3988-4d3e-af34-4e070a75a7e1',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/0fecfb10-da9e-48d6-a676-77e5a8f13b3c/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:09:369F1000',
                'size': 0,
                'checksum': '',
                'id': 'b5296333-5373-4c5f-84c4-16344594531c',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/69919d6f-5528-4ea7-b628-00f83589b906/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:26:25F1000',
                'size': 0,
                'checksum': '',
                'id': '0255aeb9-1f34-4a9f-911e-c829c427e198',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/151b0399-c36b-408b-a0d5-99e2ce92b7cc/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:21:861F1000',
                'size': 0,
                'checksum': '',
                'id': 'c615b60d-9225-4a7a-82dc-3976ba1534f5',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/8ac8cf86-85ac-44f4-bfbc-b21cf1080378/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:14:574F1000',
                'size': 0,
                'checksum': '',
                'id': 'ff8eca30-31b6-47e6-9101-99253d2b7b55',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/b37d22ed-2adb-4c3e-a8e7-a3e5a00c31ea/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:07:287F1000',
                'size': 0,
                'checksum': '',
                'id': '25aaf7e7-028f-46d1-8c96-795c86fb4f9a',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/131c72b3-2d1c-4b78-98cc-58aedc1eb759/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:20:820F1000',
                'size': 0,
                'checksum': '',
                'id': 'c5da4be4-e97a-48d8-bee9-cc82bc262796',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/546535c4-6520-4116-97c8-2b72fca68ab4/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presenter/timeline+preview',
                'ref': 'track:track-6',
                'size': 0,
                'checksum': '',
                'id': '4cc3139c-501b-4915-80bb-47982286c2b0',
                'mediatype': 'image/png',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/8322388c-34ab-428f-ab8e-27e8591205fa/SHOT4_4K_CC_injected_8cef55f0_7354_4f03_aaf6_ead935d85d63_timelinepreviews.png',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:02:82F1000',
                'size': 0,
                'checksum': '',
                'id': '1ca15e41-fe51-49ad-ade3-e9a9ee1ae357',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/96c93ca6-3a1a-4bab-8bab-3b1adf1433bd/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            },
            {
                'flavor': 'presentation/segment+preview',
                'ref': 'track:ecc5cb59-1be6-4357-a908-67d15a14133b;time=T00:00:10:410F1000',
                'size': 0,
                'checksum': '',
                'id': 'e2d1ffa9-773c-4f26-a1e4-7a95cedf29a1',
                'mediatype': 'image/jpeg',
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/c0c2ca41-1a66-4811-af89-e9e543340a0b/SHOT4_4K_CC_injected.jpg',
                'tags': [
                    'engage-download'
                ]
            }
        ],
        'channel': 'engage-player',
        'id': '74617da7-425e-4bed-a91f-5ae83d96588d',
        'media': [
            {
                'has_audio': false,
                'framerate': 25,
                'description': '',
                'bitrate': 480602,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/a4227095-2b28-4846-b538-a0c8129d54b8/SHOT4_4K_CC_injected.mp4',
                'has_video': true,
                'tags': [
                    '1080p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presenter/delivery',
                'duration': 31240,
                'size': -1,
                'framecount': 781,
                'checksum': '396db113918f324e6876fc071a47e854 (md5)',
                'width': 720,
                'id': '93aa0584-4545-4705-b886-123c7317ab8a',
                'mediatype': 'video/mp4',
                'height': 1080
            },
            {
                'has_audio': false,
                'framerate': 25,
                'description': '',
                'bitrate': 480602,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/93852735-e6a5-479b-825c-9d17e5d2312f/SHOT4_4K_CC_injected.mp4',
                'has_video': true,
                'tags': [
                    '720p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presenter/delivery',
                'duration': 31240,
                'size': -1,
                'framecount': 781,
                'checksum': '70b99548d6366875187044a99ec2e091 (md5)',
                'width': 720,
                'id': 'baf4f9d2-b1ee-458c-b0c1-eb7cb89a774a',
                'mediatype': 'video/mp4',
                'height': 720
            },
            {
                'has_audio': false,
                'framerate': 25,
                'description': '',
                'bitrate': 480602,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/e11d592c-f67c-423c-a275-fb4d398685d9/SHOT4_4K_CC_injected.mp4',
                'has_video': true,
                'tags': [
                    '360p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presentation/delivery',
                'duration': 31240,
                'size': -1,
                'framecount': 781,
                'checksum': '396db113918f324e6876fc071a47e854 (md5)',
                'width': 720,
                'id': '189be077-b937-4e5b-b090-2165867a17e7',
                'mediatype': 'video/mp4',
                'height': 360
            },
            {
                'has_audio': false,
                'framerate': 25,
                'description': '',
                'bitrate': 480602,
                'url': 'https://ocast-devel-i1.it.helsinki.fi/static/mh_default_org/api/9059828c-8cef-4caf-a878-d6fa0a359857/e11d592c-f67c-423c-a275-fb4d39868510/SHOT4_4K_CC_injected.mp4',
                'has_video': true,
                'tags': [
                    '720p-quality',
                    'engage-download',
                    'engage-streaming'
                ],
                'flavor': 'presentation/delivery',
                'duration': 31240,
                'size': -1,
                'framecount': 781,
                'checksum': '396db113918f324e6876fc071a47e854 (md5)',
                'width': 720,
                'id': '189be077-b937-4e5b-b090-2165867a17e7',
                'mediatype': 'video/mp4',
                'height': 720
            }
        ],
        'mediatype': 'application/json',
        'url': 'http://ocast-devel-a1.it.helsinki.fi/api/events/9059828c-8cef-4caf-a878-d6fa0a359857'
    },
    {
        'metadata': [],
        'attachments': [],
        'channel': 'oaipmh-default',
        'id': '99edf137-386f-439d-a846-29bc6123a1a1',
        'media': [],
        'mediatype': 'text/xml',
        'url': 'https://ocast-devel-i1.it.helsinki.fi/oaipmh/default?verb=ListMetadataFormats&identifier=9059828c-8cef-4caf-a878-d6fa0a359857'
    }
];

const mockEpisodeForEvent = {"search-results":{"offset":"0","limit":"1","total":"1","searchTime":"63","query":"(id:2d72b653\\-02f6\\-4638\\-ba58\\-281b2d49af33) AND oc_organization:mh_default_org AND (oc_acl_read:ROLE_ADMIN OR oc_acl_read:ROLE_USER OR oc_acl_read:ROLE_USER_LATAAMO_TESTI OR oc_acl_read:ROLE_ANONYMOUS) AND -oc_mediatype:Series AND -oc_deleted:[* TO *]","result":{"id":"6394a9b7-3c06-477e-841a-70862eb07bfb","org":"mh_default_org","mediapackage":{"duration":"3160","id":"6394a9b7-3c06-477e-841a-70862eb07bfb","start":"2020-03-02T15:30:00Z","title":"kaunis_taulu.mov","series":"dafd97c8-981d-4c2b-b7a0-f890a25e1020","seriestitle":"inbox vmheikki","media":{"track":{"id":"7f2fb90b-4624-415a-8e36-ce5264a56f63","type":"presenter\/delivery","ref":"track:f5e3c48b-4469-427b-8187-12ea255520cd","mimetype":"video\/mp4","tags":{"tag":["720p-quality","engage-download","engage-streaming"]},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/d280272a-8324-46f3-b2b8-504fbbeb9417\/kaunis_taulu.mp4","checksum":{"type":"md5","$":"f2fb5a87de7cbc92795a33e4e33a59f7"},"duration":3160,"audio":{"id":"audio-1","device":"","encoder":{"type":"AAC (Advanced Audio Coding)"},"framecount":130,"channels":1,"samplingrate":44100,"bitrate":67085},"video":{"id":"video-1","device":"","encoder":{"type":"H.264 \/ AVC \/ MPEG-4 AVC \/ MPEG-4 part 10"},"framecount":79,"bitrate":1423969,"framerate":25,"resolution":"1280x720"},"live":false}},"metadata":"","attachments":{"attachment":[{"id":"d74f0d42-5084-468d-b224-f2ec5f058492","type":"text\/vtt","mimetype":"text\/vtt","tags":{"tag":"archive"},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/7578df20-9939-40dc-a305-7f83e225e9af\/testwebvtt.vtt","size":0,"checksum":{"type":"md5","$":"a5b398ae76d7f5ace5c166584856898a"}},{"id":"8061f037-9c8c-4bd3-9001-1e4929a9df1f","type":"presenter\/search+preview","ref":"track:faa03c24-8cfa-4959-a8e4-e1b7d8e350b0","mimetype":"image\/jpeg","tags":{"tag":"engage-download"},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/80cd5317-c0ef-4400-b5dd-46d4e068c0ce\/kaunis_taulu_1_000s_search.jpg","size":0},{"id":"d2fa2077-db7b-401b-8a95-1710a6195c32","type":"presenter\/feed+preview","ref":"track:track-4","mimetype":"image\/jpeg","tags":{"tag":["atom","rss"]},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/c44f62c6-81f5-430e-99b6-4464113a6312\/kaunis_taulu_1_000s_feed.jpg","size":0},{"id":"3597e20b-acc0-42dc-92c4-0fb429c68138","type":"presenter\/timeline+preview","ref":"track:track-4","mimetype":"image\/png","tags":{"tag":"engage-download"},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/a46ed181-2306-4ec7-8d2d-222fa0c69038\/kaunis_taulu_c3b74776_33aa_4ab0_abc0_333a55cfafc5_timelinepreviews.png","size":0,"additionalProperties":{"property":[{"key":"resolutionY","$":"-1"},{"key":"imageCount","$":"100"},{"key":"resolutionX","$":"160"},{"key":"imageSizeY","$":"10"},{"key":"imageSizeX","$":"10"}]}},{"id":"dbb60c66-9b50-4540-879a-adcce3266232","type":"presenter\/player+preview","mimetype":"image\/png","tags":{"tag":["archive","engage-download"]},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/76604c4e-1a9e-45e0-b0ba-6762f1061ae7\/coverimage.png","size":0}]},"publications":""},"dcExtent":3160,"dcTitle":"kaunis_taulu.mov","dcIsPartOf":"dafd97c8-981d-4c2b-b7a0-f890a25e1020","ocMediapackage":"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><mediapackage duration=\"3160\" id=\"2d72b653-02f6-4638-ba58-281b2d49af33\" start=\"2020-03-02T15:30:00Z\" xmlns=\"http:\/\/mediapackage.opencastproject.org\"><title>kaunis_taulu.mov<\/title><series>dafd97c8-981d-4c2b-b7a0-f890a25e1020<\/series><seriestitle>inbox vmheikki<\/seriestitle><media><track id=\"7f2fb90b-4624-415a-8e36-ce5264a56f63\" type=\"presenter\/delivery\" ref=\"track:f5e3c48b-4469-427b-8187-12ea255520cd\"><mimetype>video\/mp4<\/mimetype><tags><tag>720p-quality<\/tag><tag>engage-download<\/tag><tag>engage-streaming<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/d280272a-8324-46f3-b2b8-504fbbeb9417\/kaunis_taulu.mp4<\/url><checksum type=\"md5\">f2fb5a87de7cbc92795a33e4e33a59f7<\/checksum><duration>3160<\/duration><audio id=\"audio-1\"><device\/><encoder type=\"AAC (Advanced Audio Coding)\"\/><framecount>130<\/framecount><channels>1<\/channels><samplingrate>44100<\/samplingrate><bitrate>67085.0<\/bitrate><\/audio><video id=\"video-1\"><device\/><encoder type=\"H.264 \/ AVC \/ MPEG-4 AVC \/ MPEG-4 part 10\"\/><framecount>79<\/framecount><bitrate>1423969.0<\/bitrate><framerate>25.0<\/framerate><resolution>1280x720<\/resolution><\/video><live>false<\/live><\/track><\/media><metadata\/><attachments><attachment id=\"d74f0d42-5084-468d-b224-f2ec5f058492\" type=\"text\/vtt\"><mimetype>text\/vtt<\/mimetype><tags><tag>archive<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/7578df20-9939-40dc-a305-7f83e225e9af\/testwebvtt.vtt<\/url><size>0<\/size><checksum type=\"md5\">a5b398ae76d7f5ace5c166584856898a<\/checksum><\/attachment><attachment id=\"8061f037-9c8c-4bd3-9001-1e4929a9df1f\" type=\"presenter\/search+preview\" ref=\"track:faa03c24-8cfa-4959-a8e4-e1b7d8e350b0\"><mimetype>image\/jpeg<\/mimetype><tags><tag>engage-download<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/80cd5317-c0ef-4400-b5dd-46d4e068c0ce\/kaunis_taulu_1_000s_search.jpg<\/url><size>0<\/size><\/attachment><attachment id=\"d2fa2077-db7b-401b-8a95-1710a6195c32\" type=\"presenter\/feed+preview\" ref=\"track:track-4\"><mimetype>image\/jpeg<\/mimetype><tags><tag>atom<\/tag><tag>rss<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/c44f62c6-81f5-430e-99b6-4464113a6312\/kaunis_taulu_1_000s_feed.jpg<\/url><size>0<\/size><\/attachment><attachment id=\"3597e20b-acc0-42dc-92c4-0fb429c68138\" type=\"presenter\/timeline+preview\" ref=\"track:track-4\"><mimetype>image\/png<\/mimetype><tags><tag>engage-download<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/a46ed181-2306-4ec7-8d2d-222fa0c69038\/kaunis_taulu_c3b74776_33aa_4ab0_abc0_333a55cfafc5_timelinepreviews.png<\/url><size>0<\/size><additionalProperties><property key=\"resolutionY\">-1<\/property><property key=\"imageCount\">100<\/property><property key=\"resolutionX\">160<\/property><property key=\"imageSizeY\">10<\/property><property key=\"imageSizeX\">10<\/property><\/additionalProperties><\/attachment><attachment id=\"dbb60c66-9b50-4540-879a-adcce3266232\" type=\"presenter\/player+preview\"><mimetype>image\/png<\/mimetype><tags><tag>archive<\/tag><tag>engage-download<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/76604c4e-1a9e-45e0-b0ba-6762f1061ae7\/coverimage.png<\/url><size>0<\/size><\/attachment><\/attachments><publications\/><\/mediapackage>","mediaType":"AudioVisual","keywords":"","modified":"2020-03-04T14:17:42.756Z","score":1.5839602}}}
const mockEpisodeForEvent2 = {"search-results":{"offset":"0","limit":"1","total":"1","searchTime":"63","query":"(id:2d72b653\\-02f6\\-4638\\-ba58\\-281b2d49af33) AND oc_organization:mh_default_org AND (oc_acl_read:ROLE_ADMIN OR oc_acl_read:ROLE_USER OR oc_acl_read:ROLE_USER_LATAAMO_TESTI OR oc_acl_read:ROLE_ANONYMOUS) AND -oc_mediatype:Series AND -oc_deleted:[* TO *]","result":{"id":"1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4","org":"mh_default_org","mediapackage":{"duration":"3160","id":"1fb5245f-ee1b-44cd-89f3-5ccf456ea0d4","start":"2020-03-02T15:30:00Z","title":"kaunis_taulu.mov","series":"dafd97c8-981d-4c2b-b7a0-f890a25e1020","seriestitle":"inbox vmheikki","media":{"track":{"id":"7f2fb90b-4624-415a-8e36-ce5264a56f63","type":"presenter\/delivery","ref":"track:f5e3c48b-4469-427b-8187-12ea255520cd","mimetype":"video\/mp4","tags":{"tag":["720p-quality","engage-download","engage-streaming"]},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/d280272a-8324-46f3-b2b8-504fbbeb9417\/kaunis_taulu.mp4","checksum":{"type":"md5","$":"f2fb5a87de7cbc92795a33e4e33a59f7"},"duration":3160,"audio":{"id":"audio-1","device":"","encoder":{"type":"AAC (Advanced Audio Coding)"},"framecount":130,"channels":1,"samplingrate":44100,"bitrate":67085},"video":{"id":"video-1","device":"","encoder":{"type":"H.264 \/ AVC \/ MPEG-4 AVC \/ MPEG-4 part 10"},"framecount":79,"bitrate":1423969,"framerate":25,"resolution":"1280x720"},"live":false}},"metadata":"","attachments":{"attachment":[{"id":"d74f0d42-5084-468d-b224-f2ec5f058492","type":"text\/vtt","mimetype":"text\/vtt","tags":{"tag":"archive"},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/7578df20-9939-40dc-a305-7f83e225e9af\/testwebvtt.vtt","size":0,"checksum":{"type":"md5","$":"a5b398ae76d7f5ace5c166584856898a"}},{"id":"8061f037-9c8c-4bd3-9001-1e4929a9df1f","type":"presenter\/search+preview","ref":"track:faa03c24-8cfa-4959-a8e4-e1b7d8e350b0","mimetype":"image\/jpeg","tags":{"tag":"engage-download"},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/80cd5317-c0ef-4400-b5dd-46d4e068c0ce\/kaunis_taulu_1_000s_search.jpg","size":0},{"id":"d2fa2077-db7b-401b-8a95-1710a6195c32","type":"presenter\/feed+preview","ref":"track:track-4","mimetype":"image\/jpeg","tags":{"tag":["atom","rss"]},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/c44f62c6-81f5-430e-99b6-4464113a6312\/kaunis_taulu_1_000s_feed.jpg","size":0},{"id":"3597e20b-acc0-42dc-92c4-0fb429c68138","type":"presenter\/timeline+preview","ref":"track:track-4","mimetype":"image\/png","tags":{"tag":"engage-download"},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/a46ed181-2306-4ec7-8d2d-222fa0c69038\/kaunis_taulu_c3b74776_33aa_4ab0_abc0_333a55cfafc5_timelinepreviews.png","size":0,"additionalProperties":{"property":[{"key":"resolutionY","$":"-1"},{"key":"imageCount","$":"100"},{"key":"resolutionX","$":"160"},{"key":"imageSizeY","$":"10"},{"key":"imageSizeX","$":"10"}]}},{"id":"dbb60c66-9b50-4540-879a-adcce3266232","type":"presenter\/player+preview","mimetype":"image\/png","tags":{"tag":["archive","engage-download"]},"url":"http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/76604c4e-1a9e-45e0-b0ba-6762f1061ae7\/coverimage.png","size":0}]},"publications":""},"dcExtent":3160,"dcTitle":"kaunis_taulu.mov","dcIsPartOf":"dafd97c8-981d-4c2b-b7a0-f890a25e1020","ocMediapackage":"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><mediapackage duration=\"3160\" id=\"2d72b653-02f6-4638-ba58-281b2d49af33\" start=\"2020-03-02T15:30:00Z\" xmlns=\"http:\/\/mediapackage.opencastproject.org\"><title>kaunis_taulu.mov<\/title><series>dafd97c8-981d-4c2b-b7a0-f890a25e1020<\/series><seriestitle>inbox vmheikki<\/seriestitle><media><track id=\"7f2fb90b-4624-415a-8e36-ce5264a56f63\" type=\"presenter\/delivery\" ref=\"track:f5e3c48b-4469-427b-8187-12ea255520cd\"><mimetype>video\/mp4<\/mimetype><tags><tag>720p-quality<\/tag><tag>engage-download<\/tag><tag>engage-streaming<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/d280272a-8324-46f3-b2b8-504fbbeb9417\/kaunis_taulu.mp4<\/url><checksum type=\"md5\">f2fb5a87de7cbc92795a33e4e33a59f7<\/checksum><duration>3160<\/duration><audio id=\"audio-1\"><device\/><encoder type=\"AAC (Advanced Audio Coding)\"\/><framecount>130<\/framecount><channels>1<\/channels><samplingrate>44100<\/samplingrate><bitrate>67085.0<\/bitrate><\/audio><video id=\"video-1\"><device\/><encoder type=\"H.264 \/ AVC \/ MPEG-4 AVC \/ MPEG-4 part 10\"\/><framecount>79<\/framecount><bitrate>1423969.0<\/bitrate><framerate>25.0<\/framerate><resolution>1280x720<\/resolution><\/video><live>false<\/live><\/track><\/media><metadata\/><attachments><attachment id=\"d74f0d42-5084-468d-b224-f2ec5f058492\" type=\"text\/vtt\"><mimetype>text\/vtt<\/mimetype><tags><tag>archive<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/7578df20-9939-40dc-a305-7f83e225e9af\/testwebvtt.vtt<\/url><size>0<\/size><checksum type=\"md5\">a5b398ae76d7f5ace5c166584856898a<\/checksum><\/attachment><attachment id=\"8061f037-9c8c-4bd3-9001-1e4929a9df1f\" type=\"presenter\/search+preview\" ref=\"track:faa03c24-8cfa-4959-a8e4-e1b7d8e350b0\"><mimetype>image\/jpeg<\/mimetype><tags><tag>engage-download<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/80cd5317-c0ef-4400-b5dd-46d4e068c0ce\/kaunis_taulu_1_000s_search.jpg<\/url><size>0<\/size><\/attachment><attachment id=\"d2fa2077-db7b-401b-8a95-1710a6195c32\" type=\"presenter\/feed+preview\" ref=\"track:track-4\"><mimetype>image\/jpeg<\/mimetype><tags><tag>atom<\/tag><tag>rss<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/c44f62c6-81f5-430e-99b6-4464113a6312\/kaunis_taulu_1_000s_feed.jpg<\/url><size>0<\/size><\/attachment><attachment id=\"3597e20b-acc0-42dc-92c4-0fb429c68138\" type=\"presenter\/timeline+preview\" ref=\"track:track-4\"><mimetype>image\/png<\/mimetype><tags><tag>engage-download<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/a46ed181-2306-4ec7-8d2d-222fa0c69038\/kaunis_taulu_c3b74776_33aa_4ab0_abc0_333a55cfafc5_timelinepreviews.png<\/url><size>0<\/size><additionalProperties><property key=\"resolutionY\">-1<\/property><property key=\"imageCount\">100<\/property><property key=\"resolutionX\">160<\/property><property key=\"imageSizeY\">10<\/property><property key=\"imageSizeX\">10<\/property><\/additionalProperties><\/attachment><attachment id=\"dbb60c66-9b50-4540-879a-adcce3266232\" type=\"presenter\/player+preview\"><mimetype>image\/png<\/mimetype><tags><tag>archive<\/tag><tag>engage-download<\/tag><\/tags><url>http:\/\/localhost:8080\/static\/mh_default_org\/engage-player\/2d72b653-02f6-4638-ba58-281b2d49af33\/76604c4e-1a9e-45e0-b0ba-6762f1061ae7\/coverimage.png<\/url><size>0<\/size><\/attachment><\/attachments><publications\/><\/mediapackage>","mediaType":"AudioVisual","keywords":"","modified":"2020-03-04T14:17:42.756Z","score":1.5839602}}}

// /api/series/3f9ff5b-7663-54b7-b7cf-950be665de3c
const inboxUserSeries = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/series/${CONSTANTS.TEST_INBOX_SERIES_ID}`)
    .reply(200, mockUserInboxSeries).persist();

const inboxUserSeries1 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/series/${CONSTANTS.TEST_INBOX_SERIES_ID}`)
    .reply(200, mockUserInboxSeries[0]).persist();

// /api/series/3f9ff5b-7663-54b7-b7cf-950be665de3c
const trashUserSeries = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/series/${CONSTANTS.TEST_TRASH_SERIES_ID}`)
    .reply(200, mockUserTrashSeries).persist();

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

const event = () => nock(CONSTANTS.OCAST_BASE_URL)
  .get(`${CONSTANTS.OCAST_VIDEOS_PATH}234234234`)
  .reply(200, mockEvent);

const event1Publications = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_EVENT_1_ID}${CONSTANTS.OCAST_VIDEO_PUBLICATION_PATH}`)
    .reply(200, mockEventPublicationContainsOneVideoWithDifferentQualities);

const event2Publications = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_EVENT_2_ID}${CONSTANTS.OCAST_VIDEO_PUBLICATION_PATH}`)
    .reply(200, mockEventPublicationContainsTwoVideosWithDifferentQualities);


const event3Publications = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_INBOX_EVENT_1}${CONSTANTS.OCAST_VIDEO_PUBLICATION_PATH}`)
    .reply(200, []);

const event4Publications = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_INBOX_EVENT_2}${CONSTANTS.OCAST_VIDEO_PUBLICATION_PATH}`)
    .reply(200, []);

const event5Publications = () => nock(Constants.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_INBOX_EVENT_2}${CONSTANTS.OCAST_}`)
    .reply(200, mockEventPublicationContainsTwoVideosWithDifferentQualities);


const eventTrash3Publications = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_TRASH_EVENT_1}${CONSTANTS.OCAST_VIDEO_PUBLICATION_PATH}`)
    .reply(200, mockEventPublicationContainsOneVideoWithDifferentQualities);

const eventTrash4Publications = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_TRASH_EVENT_2}${CONSTANTS.OCAST_VIDEO_PUBLICATION_PATH}`)
    .reply(200, mockEventPublicationContainsTwoVideosWithDifferentQualities);

const event1VttFile = () => nock('http://localhost:8080')
    .get('/static/mh_default_org/engage-player/2d72b653-02f6-4638-ba58-281b2d49af33/7578df20-9939-40dc-a305-7f83e225e9af/testwebvtt.vtt')
    .reply(200, mockEvent1VttFile);

const event2VttFile = () => nock('http://localhost:8080')
    .get('/static/mh_default_org/engage-player/2d72b653-02f6-4638-ba58-281b2d49af33/7578df20-9939-40dc-a305-7f83e225e9af/testwebvtt.vtt')
    .reply(200, mockEvent1VttFile);

const eventEpisode = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_EVENT_EPISODE_PATH}?id=${CONSTANTS.TEST_EVENT_1_ID}`)
    .reply(200, mockEpisodeForEvent);

const event2Episode = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_EVENT_EPISODE_PATH}?id=${CONSTANTS.TEST_EVENT_2_ID}`)
    .reply(200, mockEpisodeForEvent2);

const event3Episode = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_EVENT_EPISODE_PATH}?id=${CONSTANTS.TEST_INBOX_EVENT_1}`)
    .reply(200, mockEpisodeForEvent);

const event4Episode = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_EVENT_EPISODE_PATH}?id=${CONSTANTS.TEST_INBOX_EVENT_2}`)
    .reply(200, mockEpisodeForEvent2);


const eventTrash3Episode = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_EVENT_EPISODE_PATH}?id=${CONSTANTS.TEST_TRASH_EVENT_1}`)
    .reply(200, mockEpisodeForEvent);

const eventTrash4Episode = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_EVENT_EPISODE_PATH}?id=${CONSTANTS.TEST_TRASH_EVENT_2}`)
    .reply(200, mockEpisodeForEvent2);

const mockInboxEventMetadata1 = [{'flavor':'dublincore\/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'INBOX EVENT 1','required':true},{'readOnly':false,'id':'subjects','label':'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT','type':'text','value':['Testin more'],'required':false},{'readOnly':false,'id':'description','label':'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION','type':'text_long','value':'','required':false},{'translatable':true,'readOnly':false,'id':'language','label':'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE','type':'text','value':'','required':false},{'readOnly':false,'id':'rightsHolder','label':'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS','type':'text','value':'','required':false},{'translatable':true,'readOnly':false,'id':'license','label':'EVENTS.EVENTS.DETAILS.METADATA.LICENSE','type':'text','value':'ALLRIGHTS','required':false},{'translatable':false,'readOnly':false,'id':'isPartOf','label':'EVENTS.EVENTS.DETAILS.METADATA.SERIES','type':'text','value':CONSTANTS.TEST_INBOX_SERIES_ID,'required':false},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','type':'mixed_text','value':[],'required':false},{'translatable':false,'readOnly':false,'id':'contributor','label':'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS','type':'mixed_text','value':['tzrasane'],'required':false},{'readOnly':false,'id':'startDate','label':'EVENTS.EVENTS.DETAILS.METADATA.START_DATE','type':'date','value':'2019-06-12','required':false},{'readOnly':false,'id':'startTime','label':'EVENTS.EVENTS.DETAILS.METADATA.START_TIME','type':'time','value':'07:47','required':false},{'readOnly':false,'id':'duration','label':'EVENTS.EVENTS.DETAILS.METADATA.DURATION','type':'text','value':'00:00:00','required':false},{'readOnly':false,'id':'location','label':'EVENTS.EVENTS.DETAILS.METADATA.LOCATION','type':'text','value':'','required':false},{'readOnly':false,'id':'source','label':'EVENTS.EVENTS.DETAILS.METADATA.SOURCE','type':'text','value':'','required':false},{'readOnly':true,'id':'created','label':'EVENTS.EVENTS.DETAILS.METADATA.CREATED','type':'date','value':'2019-06-12T07:47:49.000Z','required':false},{'readOnly':true,'id':'identifier','label':'EVENTS.EVENTS.DETAILS.METADATA.ID','type':'text','value':CONSTANTS.TEST_INBOX_EVENT_1,'required':false}]}];
const mockInboxEventMetadata2= [{'flavor':'dublincore\/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'INBOX EVENT 2','required':true},{'readOnly':false,'id':'subjects','label':'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT','type':'text','value':['Testin more'],'required':false},{'readOnly':false,'id':'description','label':'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION','type':'text_long','value':'','required':false},{'translatable':true,'readOnly':false,'id':'language','label':'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE','type':'text','value':'','required':false},{'readOnly':false,'id':'rightsHolder','label':'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS','type':'text','value':'','required':false},{'translatable':true,'readOnly':false,'id':'license','label':'EVENTS.EVENTS.DETAILS.METADATA.LICENSE','type':'text','value':'ALLRIGHTS','required':false},{'translatable':false,'readOnly':false,'id':'isPartOf','label':'EVENTS.EVENTS.DETAILS.METADATA.SERIES','type':'text','value':CONSTANTS.TEST_INBOX_SERIES_ID,'required':false},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','type':'mixed_text','value':[],'required':false},{'translatable':false,'readOnly':false,'id':'contributor','label':'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS','type':'mixed_text','value':['tzrasane'],'required':false},{'readOnly':false,'id':'startDate','label':'EVENTS.EVENTS.DETAILS.METADATA.START_DATE','type':'date','value':'2019-06-12','required':false},{'readOnly':false,'id':'startTime','label':'EVENTS.EVENTS.DETAILS.METADATA.START_TIME','type':'time','value':'07:47','required':false},{'readOnly':false,'id':'duration','label':'EVENTS.EVENTS.DETAILS.METADATA.DURATION','type':'text','value':'00:00:00','required':false},{'readOnly':false,'id':'location','label':'EVENTS.EVENTS.DETAILS.METADATA.LOCATION','type':'text','value':'','required':false},{'readOnly':false,'id':'source','label':'EVENTS.EVENTS.DETAILS.METADATA.SOURCE','type':'text','value':'','required':false},{'readOnly':true,'id':'created','label':'EVENTS.EVENTS.DETAILS.METADATA.CREATED','type':'date','value':'2019-06-12T07:47:49.000Z','required':false},{'readOnly':true,'id':'identifier','label':'EVENTS.EVENTS.DETAILS.METADATA.ID','type':'text','value':CONSTANTS.TEST_INBOX_EVENT_2,'required':false}]}];

const mockTrashEventMetadata1 = [{'flavor':'dublincore\/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'TRASH EVENT 1','required':true},{'readOnly':false,'id':'subjects','label':'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT','type':'text','value':['Testing trash'],'required':false},{'readOnly':false,'id':'description','label':'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION','type':'text_long','value':'','required':false},{'translatable':true,'readOnly':false,'id':'language','label':'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE','type':'text','value':'','required':false},{'readOnly':false,'id':'rightsHolder','label':'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS','type':'text','value':'','required':false},{'translatable':true,'readOnly':false,'id':'license','label':'EVENTS.EVENTS.DETAILS.METADATA.LICENSE','type':'text','value':'ALLRIGHTS','required':false},{'translatable':false,'readOnly':false,'id':'isPartOf','label':'EVENTS.EVENTS.DETAILS.METADATA.SERIES','type':'text','value':CONSTANTS.TEST_TRASH_SERIES_ID,'required':false},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','type':'mixed_text','value':[],'required':false},{'translatable':false,'readOnly':false,'id':'contributor','label':'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS','type':'mixed_text','value':['hpalva'],'required':false},{'readOnly':false,'id':'startDate','label':'EVENTS.EVENTS.DETAILS.METADATA.START_DATE','type':'date','value':'2019-06-12','required':false},{'readOnly':false,'id':'startTime','label':'EVENTS.EVENTS.DETAILS.METADATA.START_TIME','type':'time','value':'07:47','required':false},{'readOnly':false,'id':'duration','label':'EVENTS.EVENTS.DETAILS.METADATA.DURATION','type':'text','value':'00:00:00','required':false},{'readOnly':false,'id':'location','label':'EVENTS.EVENTS.DETAILS.METADATA.LOCATION','type':'text','value':'','required':false},{'readOnly':false,'id':'source','label':'EVENTS.EVENTS.DETAILS.METADATA.SOURCE','type':'text','value':'','required':false},{'readOnly':true,'id':'created','label':'EVENTS.EVENTS.DETAILS.METADATA.CREATED','type':'date','value':'2019-06-12T07:47:49.000Z','required':false},{'readOnly':true,'id':'identifier','label':'EVENTS.EVENTS.DETAILS.METADATA.ID','type':'text','value':CONSTANTS.TEST_TRASH_EVENT_1,'required':false}]}];
const mockTrashEventMetadata2= [{'flavor':'dublincore\/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'TRASH EVENT 2','required':true},{'readOnly':false,'id':'subjects','label':'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT','type':'text','value':['Testing trash'],'required':false},{'readOnly':false,'id':'description','label':'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION','type':'text_long','value':'','required':false},{'translatable':true,'readOnly':false,'id':'language','label':'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE','type':'text','value':'','required':false},{'readOnly':false,'id':'rightsHolder','label':'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS','type':'text','value':'','required':false},{'translatable':true,'readOnly':false,'id':'license','label':'EVENTS.EVENTS.DETAILS.METADATA.LICENSE','type':'text','value':'ALLRIGHTS','required':false},{'translatable':false,'readOnly':false,'id':'isPartOf','label':'EVENTS.EVENTS.DETAILS.METADATA.SERIES','type':'text','value':CONSTANTS.TEST_TRASH_SERIES_ID,'required':false},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','type':'mixed_text','value':[],'required':false},{'translatable':false,'readOnly':false,'id':'contributor','label':'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS','type':'mixed_text','value':['hpalva'],'required':false},{'readOnly':false,'id':'startDate','label':'EVENTS.EVENTS.DETAILS.METADATA.START_DATE','type':'date','value':'2019-06-12','required':false},{'readOnly':false,'id':'startTime','label':'EVENTS.EVENTS.DETAILS.METADATA.START_TIME','type':'time','value':'07:47','required':false},{'readOnly':false,'id':'duration','label':'EVENTS.EVENTS.DETAILS.METADATA.DURATION','type':'text','value':'00:00:00','required':false},{'readOnly':false,'id':'location','label':'EVENTS.EVENTS.DETAILS.METADATA.LOCATION','type':'text','value':'','required':false},{'readOnly':false,'id':'source','label':'EVENTS.EVENTS.DETAILS.METADATA.SOURCE','type':'text','value':'','required':false},{'readOnly':true,'id':'created','label':'EVENTS.EVENTS.DETAILS.METADATA.CREATED','type':'date','value':'2019-06-12T07:47:49.000Z','required':false},{'readOnly':true,'id':'identifier','label':'EVENTS.EVENTS.DETAILS.METADATA.ID','type':'text','value':CONSTANTS.TEST_TRASH_EVENT_2,'required':false}]}];

const mockEventMetadata1 = [{'flavor':'dublincore\/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'LATAAMO-103 toka','required':true},{'readOnly':false,'id':'subjects','label':'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT','type':'text','value':['Testin more'],'required':false},{'readOnly':false,'id':'description','label':'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION','type':'text_long','value':'','required':false},{'translatable':true,'readOnly':false,'id':'language','label':'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE','type':'text','value':'','required':false},{'readOnly':false,'id':'rightsHolder','label':'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS','type':'text','value':'','required':false},{'translatable':true,'readOnly':false,'id':'license','label':'EVENTS.EVENTS.DETAILS.METADATA.LICENSE','type':'text','value':'ALLRIGHTS','required':false},{'translatable':false,'readOnly':false,'id':'isPartOf','label':'EVENTS.EVENTS.DETAILS.METADATA.SERIES','type':'text','value':'80f9ff5b-4163-48b7-b7cf-950be665de3c','required':false},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','type':'mixed_text','value':[],'required':false},{'translatable':false,'readOnly':false,'id':'contributor','label':'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS','type':'mixed_text','value':['tzrasane'],'required':false},{'readOnly':false,'id':'startDate','label':'EVENTS.EVENTS.DETAILS.METADATA.START_DATE','type':'date','value':'2019-06-12','required':false},{'readOnly':false,'id':'startTime','label':'EVENTS.EVENTS.DETAILS.METADATA.START_TIME','type':'time','value':'07:47','required':false},{'readOnly':false,'id':'duration','label':'EVENTS.EVENTS.DETAILS.METADATA.DURATION','type':'text','value':'00:00:00','required':false},{'readOnly':false,'id':'location','label':'EVENTS.EVENTS.DETAILS.METADATA.LOCATION','type':'text','value':'','required':false},{'readOnly':false,'id':'source','label':'EVENTS.EVENTS.DETAILS.METADATA.SOURCE','type':'text','value':'','required':false},{'readOnly':true,'id':'created','label':'EVENTS.EVENTS.DETAILS.METADATA.CREATED','type':'date','value':'2019-06-12T07:47:49.000Z','required':false},{'readOnly':true,'id':'identifier','label':'EVENTS.EVENTS.DETAILS.METADATA.ID','type':'text','value':CONSTANTS.TEST_EVENT_1_ID,'required':false}]}];
const mockEventMetadata2 = [{'flavor':'dublincore\/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'LAATAMO-103','required':true},{'readOnly':false,'id':'subjects','label':'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT','type':'text','value':['testing'],'required':false},{'readOnly':false,'id':'description','label':'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION','type':'text_long','value':'','required':false},{'translatable':true,'readOnly':false,'id':'language','label':'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE','type':'text','value':'','required':false},{'readOnly':false,'id':'rightsHolder','label':'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS','type':'text','value':'','required':false},{'translatable':true,'readOnly':false,'id':'license','label':'EVENTS.EVENTS.DETAILS.METADATA.LICENSE','type':'text','value':'ALLRIGHTS','required':false},{'translatable':false,'readOnly':false,'id':'isPartOf','label':'EVENTS.EVENTS.DETAILS.METADATA.SERIES','type':'text','value':'80f9ff5b-4163-48b7-b7cf-950be665de3c','required':false},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','type':'mixed_text','value':[],'required':false},{'translatable':false,'readOnly':false,'id':'contributor','label':'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS','type':'mixed_text','value':['tzrasane'],'required':false},{'readOnly':false,'id':'startDate','label':'EVENTS.EVENTS.DETAILS.METADATA.START_DATE','type':'date','value':'2019-06-11','required':false},{'readOnly':false,'id':'startTime','label':'EVENTS.EVENTS.DETAILS.METADATA.START_TIME','type':'time','value':'13:04','required':false},{'readOnly':false,'id':'duration','label':'EVENTS.EVENTS.DETAILS.METADATA.DURATION','type':'text','value':'00:00:00','required':false},{'readOnly':false,'id':'location','label':'EVENTS.EVENTS.DETAILS.METADATA.LOCATION','type':'text','value':'','required':false},{'readOnly':false,'id':'source','label':'EVENTS.EVENTS.DETAILS.METADATA.SOURCE','type':'text','value':'','required':false},{'readOnly':true,'id':'created','label':'EVENTS.EVENTS.DETAILS.METADATA.CREATED','type':'date','value':'2019-06-11T13:04:43.000Z','required':false},{'readOnly':true,'id':'identifier','label':'EVENTS.EVENTS.DETAILS.METADATA.ID','type':'text','value':CONSTANTS.TEST_EVENT_2_ID,'required':false}]}];
const mockEventMetadata3 = [{'flavor':'dublincore\/episode','title':'EVENTS.EVENTS.DETAILS.CATALOG.EPISODE','fields':[{'readOnly':false,'id':'title','label':'EVENTS.EVENTS.DETAILS.METADATA.TITLE','type':'text','value':'Captivating title','required':true},{'readOnly':false,'id':'subjects','label':'EVENTS.EVENTS.DETAILS.METADATA.SUBJECT','type':'text','value':['John Clark','Thiago Melo Costa'],'required':false},{'readOnly':false,'id':'description','label':'EVENTS.EVENTS.DETAILS.METADATA.DESCRIPTION','type':'text_long','value':'A great description','required':false},{'translatable':true,'readOnly':false,'id':'language','label':'EVENTS.EVENTS.DETAILS.METADATA.LANGUAGE','type':'text','value':'','required':false},{'readOnly':false,'id':'rightsHolder','label':'EVENTS.EVENTS.DETAILS.METADATA.RIGHTS','type':'text','value':'','required':false},{'translatable':true,'readOnly':false,'id':'license','label':'EVENTS.EVENTS.DETAILS.METADATA.LICENSE','type':'text','value':'','required':false},{'translatable':false,'readOnly':false,'id':'isPartOf','label':'EVENTS.EVENTS.DETAILS.METADATA.SERIES','type':'text','value':'d72a8c9e-f854-4ba4-9ed2-89405fae214e','required':false},{'translatable':false,'readOnly':false,'id':'creator','label':'EVENTS.EVENTS.DETAILS.METADATA.PRESENTERS','type':'mixed_text','value':[],'required':false},{'translatable':false,'readOnly':false,'id':'contributor','label':'EVENTS.EVENTS.DETAILS.METADATA.CONTRIBUTORS','type':'mixed_text','value':[],'required':false},{'readOnly':false,'id':'startDate','label':'EVENTS.EVENTS.DETAILS.METADATA.START_DATE','type':'date','value':'2016-06-22','required':false},{'readOnly':false,'id':'startTime','label':'EVENTS.EVENTS.DETAILS.METADATA.START_TIME','type':'time','value':'13:30','required':false},{'readOnly':false,'id':'duration','label':'EVENTS.EVENTS.DETAILS.METADATA.DURATION','type':'text','value':'00:00:00','required':false},{'readOnly':false,'id':'location','label':'EVENTS.EVENTS.DETAILS.METADATA.LOCATION','type':'text','value':'','required':false},{'readOnly':false,'id':'source','label':'EVENTS.EVENTS.DETAILS.METADATA.SOURCE','type':'text','value':'','required':false},{'readOnly':true,'id':'created','label':'EVENTS.EVENTS.DETAILS.METADATA.CREATED','type':'date','value':'2016-06-22T13:30:00.000Z','required':false},{'readOnly':true,'id':'identifier','label':'EVENTS.EVENTS.DETAILS.METADATA.ID','type':'text','value':CONSTANTS.TEST_EVENT_3_ID,'required':false}]}];

// /api/1111/metadata
const inboxEventMetadata_1 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/${CONSTANTS.TEST_INBOX_EVENT_1}/metadata`)
    .reply(200, mockInboxEventMetadata1);

// /api/2222/metadata
const inboxEventMetadata_2 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/${CONSTANTS.TEST_INBOX_EVENT_2}/metadata`)
    .reply(200, mockInboxEventMetadata2);

// /api/3333/metadata
const trashEventMetadata_1 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/${CONSTANTS.TEST_TRASH_EVENT_1}/metadata`)
    .reply(200, mockTrashEventMetadata1);

// /api/4444/metadata
const trashEventMetadata_2 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/api/${CONSTANTS.TEST_TRASH_EVENT_2}/metadata`)
    .reply(200, mockTrashEventMetadata2);

// /admin-ng/event/22222/asset/media/444444.json
const inboxEventMediaFile1 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`/admin-ng/event/${CONSTANTS.TEST_INBOX_EVENT_1}/asset/media/${CONSTANTS.TEST_MEDIA_1_INBOX_METADATA_ID}`)
    .reply(200, mockInboxEventMetadata1);

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


// inbox series by username /api/series/?filter=title:trash%20userWithNoInboxEvents
const noTrashSeriesByUserName = () => {
    let query = encodeURI(`${CONSTANTS.TRASH} userWithNoTrashEvents`);
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=title:' + query)
        .reply(200, mockUserNoSeries);
};
// inbox series by username /api/series/?filter=title:inbox%20userWithNoInboxEvents
const noInboxSeriesByUserName = () => {
    let query = encodeURI(`${CONSTANTS.INBOX} userWithNoInboxEvents`);
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=title:' + query)
        .reply(200, mockUserNoSeries);
};

// trash series by username /api/series/?filter=title:trash%20SeriesOwnerEppn
const trashSeriesByUserName = () => {
    let query = encodeURI(`${CONSTANTS.TRASH} ${CONSTANTS.SERIES_OWNER_EPPN}`);
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=title:' + query)
        .reply(200, mockUserTrashSeries);
};

// inbox series by username /api/series/?filter=title:inbox%20SeriesOwnerEppn
const inboxSeriesByUserName = () => {
    let query = encodeURI(`${CONSTANTS.INBOX} ${CONSTANTS.SERIES_OWNER_EPPN}`);
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=title:' + query)
        .reply(200, mockUserInboxSeries);
};

// events for inbox series /api/events/?filter=series:3f9ff5b-7663-54b7-b7cf-950be665de3c
const inboxSeriesEvents = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:${CONSTANTS.TEST_INBOX_SERIES_ID}`})
    .reply(200, mockUserEventsForInboxSeries);


// events for inbox series /api/events/?filter=series:3f9ff5b-7663-54b7-b7cf-950be665de3c&withmetadata=true&withacl=true&withpublications=true
const inboxSeriesEventsForList = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}?filter=series:${CONSTANTS.TEST_INBOX_SERIES_ID}${CONSTANTS.OCAST_VIDEOS_WITH_METADATA_ACLS_AND_PUBLICATIONS}`)
    .reply(200, mockUserEventsForInboxSeriesForList);

// events for trash series /api/events/?filter=series:3f9ff5b-7663-54b7-b7cf-950be665de3c
const trashSeriesEvents = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:${CONSTANTS.TEST_TRASH_SERIES_ID}`})
    .reply(200, mockUserEventsForTrashSeries);

// events for trash series /api/events/?filter=series:3f9ff5b-7663-54b7-b7cf-950be665de3c&withmetadata=true&withacl=true&withpublications=true
const trashSeriesEventsForList = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}?filter=series:${CONSTANTS.TEST_TRASH_SERIES_ID}${CONSTANTS.OCAST_VIDEOS_WITH_METADATA_ACLS_AND_PUBLICATIONS}`)
    .reply(200, mockUserEventsForTrashSeriesForList);

// events by series /api/events/?filter=series:80f9ff5b-4163-48b7-b7cf-950be665de3c
const series1_Events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:${CONSTANTS.TEST_SERIES_1_ID}${CONSTANTS.OCAST_VIDEOS_WITH_METADATA_ACLS_AND_PUBLICATIONS}`})
    .reply(200, mockUserEventsForSeries1);

// events by series /api/events/?filter=series:80f9ff5b-4163-48b7-b7cf-950be665de3c&withmetadata=true&withacl=true&withpublications=true
const series1_new_events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}?filter=series:${CONSTANTS.TEST_SERIES_1_ID}${CONSTANTS.OCAST_VIDEOS_WITH_METADATA_ACLS_AND_PUBLICATIONS}`)
    .reply(200, mockNewUserEventsForSeries1);

// events by series /api/events/?filter=series:series:d72a8c9e-f854-4ba4-9ed2-89405fae214e
const series2_Events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:${CONSTANTS.TEST_SERIES_2_ID}`})
    .reply(200, mockUserEventsForSeries2);

// events by series /api/events/?filter=series:series:d72a8c9e-f854-4ba4-9ed2-89405fae214e&withmetadata=true&withacl=true&withpublications=true
const series2_new_events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}?filter=series:${CONSTANTS.TEST_SERIES_2_ID}${CONSTANTS.OCAST_VIDEOS_WITH_METADATA_ACLS_AND_PUBLICATIONS}`)
    .reply(200, mockNewUserEventsForSeries2);

// events by series /api/events/?filter=series:series:604d78ac-733f-4c65-b13a-29172fbc0c6f
const series3_Events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:${CONSTANTS.TEST_SERIES_3_ID}`})
    .reply(200, mockUserEventsForSeries3);

// events by series /api/events/?filter=series:series:123456
const noSeries_Events = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_VIDEOS_PATH)
    .query({filter: `series:123456`})
    .reply(200, []);

// event by id /api/event/6394a9b7-3c06-477e-841a-70862eb07bfb
const event1 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(`${CONSTANTS.OCAST_VIDEOS_PATH}${CONSTANTS.TEST_EVENT_1_ID}`)
    .reply(200, mockUserEvent1);

const lataamoSeriesEmpty = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:Tester-XYZ,contributors:grp-XYZ')
        .reply(200, mockUserSeriesEmpty);

// /api/series/?filter=Creator:Opencast Project Administrator
const lataamoSeries = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:SeriesOwnerEppn,contributors:grp-XYZ')
        .reply(200, mockUserSeries);

const lataamoSeries2 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:Tester-XYZ,contributors:grp-lataamo-2,contributors:grp-lataamo-3,contributors:grp-lataamo-1')
        .reply(200, mockUserSeries2);

const lataamoSeries3 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:NOT_CONTRIBUTOR_IN_ANY_SERIES,contributors:grp-lataamo-2,contributors:grp-lataamo-3,contributors:grp-lataamo-1')
        .reply(200, mockUserSeries2);

const lataamoSeries4 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:NOT_CONTRIBUTOR_IN_ANY_SERIES,contributors:grp-lataamo-2,contributors:grp-lataamo-3')
        .reply(200, mockUserSeriesEmpty);

const lataamoSeries5 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:NOT_CONTRIBUTOR_IN_ANY_SERIES,contributors:grp-XYZ')
        .reply(200, mockUserSeriesEmpty);

const lataamoSeries6 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:Tester-XYZ,contributors:grp-lataamo-6')
        .reply(200, mockUserSeries3);

const lataamoSeries7 = () => {
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '123456')
        .reply(200, mockUserSeries4);
};

const lataamoSeries8 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:SeriesOwnerEppn,contributors:grp-XYZ')
        .reply(200, mockUserSeries5);

const lataamoWithInboxSeries = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + '?filter=contributors:tester-xyz,contributors:')
        .reply(200, mockUserInboxSeries3);

const lataamoPostSeries = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .post(CONSTANTS.OCAST_SERIES_PATH)
        .reply(200, { identifier: CONSTANTS.SUCCESSFUL_UPDATE_ID });

const mockOcastVideoViewsCall = () => {
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_VIDEO_VIEWS_PATH + 'stats.json?id=' + CONSTANTS.TEST_EVENT_1_ID)
        .reply(200, mockVideoStats);
};

const lataamoSeries9 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + CONSTANTS.TEST_SERIES_1_ID)
        .reply(200, mockUserSeries4).persist();

const lataamoSeries10 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(CONSTANTS.OCAST_SERIES_PATH + CONSTANTS.TEST_SERIES_2_ID)
        .reply(200, mockUserSeries6).persist();

const mockOpencastUpdateEventOK = (eventId) => {
    // /api/events/d89d275a-25f6-426f-9b28-dc2607803206/metadata?type=dublincore/episode
    const videoMetaDataUrl = constPaths.OCAST_VIDEOS_PATH + eventId +
        constPaths.OCAST_METADATA_PATH + constPaths.OCAST_TYPE_QUERY_PARAMETER +
        constPaths.OCAST_TYPE_DUBLINCORE_EPISODE;

    nock(CONSTANTS.OCAST_BASE_URL)
        .put(videoMetaDataUrl)
        .reply(204, {statusText: 'No Content'});
};

const mockOpencastUpdateEventNOK = (eventId) => {
    // /api/events/d89d275a-25f6-426f-9b28-dc2607803206/metadata?type=dublincore/episode
    const videoMetaDataUrl = constPaths.OCAST_VIDEOS_PATH + eventId +
        constPaths.OCAST_METADATA_PATH + constPaths.OCAST_TYPE_QUERY_PARAMETER +
        constPaths.OCAST_TYPE_DUBLINCORE_EPISODE;

    nock(CONSTANTS.OCAST_BASE_URL)
        .put(videoMetaDataUrl)
        .reply(400);
};

const mockEventTransactionStatusActive = (eventId) => {
    const transactionStatusPath = constPaths.OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + '/hasActiveTransaction';
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(transactionStatusPath)
        .reply(200, {
            active: true
        });
};

const mockEventTransactionStatusNotActive = (eventId) => {
    const transactionStatusPath = constPaths.OCAST_EVENT_MEDIA_PATH_PREFIX + eventId + '/hasActiveTransaction';
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(transactionStatusPath)
        .reply(200, {
            active: false
        });
};

const mockOpencastFailedMediaPackageRequest = (eventId) => {
    const mediapackageUrl = '/assets/episode/' + eventId;
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(mediapackageUrl)
        .reply(400);
};

const mockOpencastMediaPackageRequest = (eventId) => {
    const mediapackageUrl = '/assets/episode/' + eventId;
    nock(CONSTANTS.OCAST_BASE_URL)
        .get(mediapackageUrl)
        .reply(200);
};

const mockOpencastFailedRepublishMetadataRequest = () => {
    const republishMetadataUrl = '/workflow/start';
    nock(CONSTANTS.OCAST_BASE_URL)
        .post(republishMetadataUrl)
        .reply(400);
};

const mockOpencastRepublishMetadataRequest = () => {
    const republishMetadataUrl = '/workflow/start';
    nock(CONSTANTS.OCAST_BASE_URL)
        .post(republishMetadataUrl)
        .reply(200);
};

const lataamoPutSeries = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .put(CONSTANTS.OCAST_UPDATE_SERIES_PATH)
        .reply(200, { identifier: CONSTANTS.SUCCESSFUL_UPDATE_ID });

const lataamoUpdateSeriesAcl = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .put(CONSTANTS.OCAST_UPDATE_SERIES_PATH + CONSTANTS.OCAST_ACL)
        .reply(200, { identifier: CONSTANTS.SUCCESSFUL_UPDATE_ID });

const lataamoUpdateSeriesMetadata = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .put(CONSTANTS.OCAST_UPDATE_SERIES_PATH + CONSTANTS.OCAST_UPDATE_SERIES_METADATA_PATH)
        .reply(200);

// /api/info/me
const lataamoApiUser = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_USER_PATH)
    .reply(200, mockApiUser);

const lataamoApiUser2 = () => nock(CONSTANTS.OCAST_BASE_URL)
    .get(CONSTANTS.OCAST_USER_PATH)
    .reply(200, mockApiUser2);

const cleanMocks = () => nock.cleanAll();


module.exports.mockApiUser = mockApiUser;
module.exports.mockTestUser = mockTestUser;
module.exports.mockTestUser2 = mockTestUser2;
module.exports.mockTestUser3 = mockTestUser3;
module.exports.mockOCastSeriesApiCallEmpty = lataamoSeriesEmpty;
module.exports.mockOCastSeriesApiCall = lataamoSeries;
module.exports.mockOCastSeriesApiCall2 = lataamoSeries2;
module.exports.mockOCastSeriesApiCall3 = lataamoSeries3;
module.exports.mockOCastSeriesApiCall4 = lataamoSeries4;
module.exports.mockOCastSeriesApiCall5 = lataamoSeries5;
module.exports.mockOCastSeriesApiCall6 = lataamoSeries6;
module.exports.mockOCastSeriesApiCall7 = lataamoSeries7;
module.exports.mockOCastSeriesApiCall8 = lataamoSeries8;
module.exports.mockOCastSeriesApiCall9 = lataamoSeries9;
module.exports.mockOCastSeriesApiCall10 = lataamoSeries10;
module.exports.mockOCastUserApiCall = lataamoApiUser;
module.exports.mockOCastUserApiCall2 = lataamoApiUser2;
module.exports.mockEvent = event;
module.exports.mockOCastEvents_1_ApiCall = series1_Events;
module.exports.mockOCastEvents_1_New_ApiCall = series1_new_events;
module.exports.mockOCastEvents_2_ApiCall = series2_Events;
module.exports.mockOCastEvents_2_New_ApiCall = series2_new_events;
module.exports.mockOcastEvetns_3_ApiCall = series3_Events;
module.exports.mockOCastEventMetadata_1Call = eventMetadata_1;
module.exports.mockOCastEventMetadata_2Call = eventMetadata_2;
module.exports.mockOCastEventMetadata_3Call = eventMetadata_3;
module.exports.mockOcastInboxEvent1Call = inboxEventMetadata_1;
module.exports.mockOcastInboxEvent2Call = inboxEventMetadata_2;
module.exports.mockOcastTrashEvent1Call = trashEventMetadata_1;
module.exports.mockOcastTrashEvent2Call = trashEventMetadata_2;
module.exports.mockOCastEvent1MediaCall = event1Media;
module.exports.mockOCastEvent2MediaCall = event2Media;
module.exports.mockOCastEvent3MediaCall = event3Media;
module.exports.mockOCastEvent1InboxMediaMetadataCall = event1InboxMediaMetadata;
module.exports.mockOCastEvent2InboxMediaMetadataCall = event2InboxMediaMetadata;
module.exports.mockOCastEvent1TrashMediaMetadataCall = event1TrashMediaMetadata;
module.exports.mockOCastEvent2TrashMediaMetadataCall = event2TrashMediaMetadata;
module.exports.mockOCastEvent1MediaMetadataCall = event1MediaMetadata;
module.exports.mockOCastEvent2MediaMetadataCall = event2MediaMetadata;
module.exports.mockOCastEvent3MediaMetadataCall = event3MediaMetadata;
module.exports.mockOcastInboxEvent1AclCall = inboxEventAclsFromSeries;
module.exports.mockOcastTrashEvent1AclCall = trashEventAclsFromSeries;
module.exports.mockOCastEvent1AclCall = eventAclsFromSeries;
module.exports.mockOcastEvent2AclCall = eventAclsFromSerie2;
module.exports.mockOcastEvent3AclCall = eventAclsFromSerie3;
module.exports.mockLataamoPostSeriesCall = lataamoPostSeries;
module.exports.mockOcastVideoViewsCall = mockOcastVideoViewsCall;
module.exports.mockEventPublicationCall = event1Publications;
module.exports.mockEvent2PublicationCall = event2Publications;
module.exports.mockEvent3PublicationCall = event3Publications;
module.exports.mockEvent4PublicationCall = event4Publications;
module.exports.mockEventTrash3PublicationCall = eventTrash3Publications;
module.exports.mockEventTrash4PublicationCall = eventTrash4Publications;
module.exports.mockEventEpisodeCall = eventEpisode;
module.exports.mockEvent2EpisodeCall = event2Episode;
module.exports.mockEvent3EpisodeCall = event3Episode;
module.exports.mockEvent4EpisodeCall = event4Episode;
module.exports.mockEventTrash3EpisodeCall = eventTrash3Episode;
module.exports.mockEventTrash4EpisodeCall = eventTrash4Episode;
module.exports.mockLataamoPutSeriesCall = lataamoPutSeries;
module.exports.mockLataamoUpdateSeriesAcl = lataamoUpdateSeriesAcl;
module.exports.mockLataamoUpdateSeriesMetadata = lataamoUpdateSeriesMetadata;
module.exports.constants = CONSTANTS;
module.exports.mockOpencastEventActiveTransaction = mockEventTransactionStatusActive;
module.exports.mockOpencastEventNoActiveTransaction = mockEventTransactionStatusNotActive;
module.exports.mockOpencastFailedMediaPackageRequest = mockOpencastFailedMediaPackageRequest;
module.exports.mockOpencastMediaPackageRequest = mockOpencastMediaPackageRequest;
module.exports.mockOpencastUpdateEventOK = mockOpencastUpdateEventOK;
module.exports.mockOpencastUpdateEventNOK = mockOpencastUpdateEventNOK;
module.exports.mockOpencastFailedRepublishMetadataRequest = mockOpencastFailedRepublishMetadataRequest;
module.exports.mockOpencastRepublishMetadataRequest = mockOpencastRepublishMetadataRequest;
module.exports.mockOpencastEvent1Request = event1;
module.exports.mockOpencastInboxSeriesRequest = inboxSeriesByUserName;
module.exports.mockOpencastTrashSeriesRequest = trashSeriesByUserName;
module.exports.mockOpencastInboxSeriesWithNoResultRequest = noInboxSeriesByUserName;
module.exports.mockOpencastTrashSeriesWithNoResultRequest = noTrashSeriesByUserName;
module.exports.mockInboxSeriesEventsRequest = inboxSeriesEvents;
module.exports.mockInboxSeriesEventsForListRequest = inboxSeriesEventsForList;
module.exports.mockTrashSeriesEventsRequest = trashSeriesEvents;
module.exports.mockTrashSeriesEventsForListRequest = trashSeriesEventsForList;
module.exports.mockInboxEvent1MediaFileMetadataCall = event1InboxMediaFileMetadata;
module.exports.mockInboxEvent2MediaFileMetadataCall = event2InboxMediaFileMetadata;
module.exports.mockTrashEvent1MediaFileMetadataCall = event1TrashMediaFileMetadata;
module.exports.mockTrashEvent2MediaFileMetadataCall = event2TrashMediaFileMetadata;
module.exports.mockInboxSeriesAclCall = inboxEventAclsFromSeries;
module.exports.mockTrashSeriesAclCall = trashEventAclsFromSeries;
module.exports.mockInboxSeriesCall = inboxUserSeries;
module.exports.mockInboxSeriesCall1 = inboxUserSeries1;
module.exports.mockTrashSeriesCall = trashUserSeries;
module.exports.mockSeriesWithInboxCall = lataamoWithInboxSeries;
module.exports.mockEvent1VttFileCall = event1VttFile;
module.exports.mockEvent2VttFileCall = event2VttFile;
module.exports.noSeriesEventsCall = noSeries_Events;
module.exports.cleanAll = cleanMocks;
