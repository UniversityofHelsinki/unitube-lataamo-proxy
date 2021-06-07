const nock = require('nock');  // https://www.npmjs.com/package/nock


// mocked Opencast APIs
const CONSTANTS = Object.freeze({
    OCAST_BASE_URL : process.env.LATAAMO_OPENCAST_HOST,
    OCAST_SERIES_PATH : '/api/series/',
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
    TRASH: 'trash'
});


const mockUserInboxSeries3_XXX = {
    catalogs: [
        {
            "http://purl.org/dc/terms/": {
                "rightsHolder": [
                    {
                        "value": "tester-xyz"
                    }
                ],
                "identifier": [
                    {
                        "value": "3f9ff5b-7663-54b7-b7cf-950be665de3c"
                    }
                ],
                "creator": [
                    {
                        "value": "Lataamo-proxy-service"
                    },
                    {
                        "value": "tester-xyz"
                    }
                ],
                "contributor": [
                    {
                        "value": "tester-xyz"
                    }
                ],
                "created": [
                    {
                        "type": "dcterms:W3CDTF",
                        "value": "2021-04-06T10:30:59Z"
                    }
                ],
                "subject": [
                    {
                        "value": "Lataamo-inbox"
                    }
                ],
                "description": [
                    {
                        "value": "Lataamo-inbox series for tester-xyz"
                    }
                ],
                "publisher": [
                    {
                        "value": "tester-xyz"
                    }
                ],
                "language": [
                    {
                        "value": "en"
                    }
                ],
                "title": [
                    {
                        "value": "inbox tester-xyz"
                    }
                ]
            }
        },
        {
            "http://purl.org/dc/terms/": {
                "rightsHolder": [
                    {
                        "value": "SeriesOwnerEppn"
                    }
                ],
                "identifier": [
                    {
                        "value": "3f9ff5b-7663-54b7-b7cf-950oo665de3c"
                    }
                ],
                "creator": [
                    {
                        "value": "Lataamo-proxy-service"
                    },
                    {
                        "value": "SeriesOwnerEppn"
                    }
                ],
                "contributor": [
                    {
                        "value": "SeriesOwnerEppn"
                    }
                ],
                "created": [
                    {
                        "type": "dcterms:W3CDTF",
                        "value": "2021-04-06T10:30:59Z"
                    }
                ],
                "subject": [
                    {
                        "value": "Lataamo-inbox"
                    }
                ],
                "description": [
                    {
                        "value": "Lataamo-inbox series for SeriesOwnerEppn"
                    }
                ],
                "publisher": [
                    {
                        "value": "SeriesOwnerEppn"
                    }
                ],
                "language": [
                    {
                        "value": "en"
                    }
                ],
                "title": [
                    {
                        "value": "inbox SeriesOwnerEppn"
                    }
                ]
            }
        }
    ], totalCount: '2' };

const mockUserSeriesEmpty_XXX = { catalogs: [], totalCount: '0' };

const userSeriesListFromOpenCastTrashInboxPlus2 =
    {
        "catalogs": [
            {
                "http://purl.org/dc/terms/": {
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_1_ID
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        },
                        {
                            "value": "jesbu"
                        },
                        {
                            "value": "grp-oppuroomu"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:33:08Z"
                        }
                    ],
                    "description": [
                        {
                            "value": "Kontributor kontribuutio"
                        }
                    ],
                    "title": [
                        {
                            "value": "Hesbu sarja"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "rightsHolder": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "identifier": [
                        {
                            "value": "06bd63f5-4a66-45c5-826f-e5a195c364ad"
                        }
                    ],
                    "creator": [
                        {
                            "value": "Lataamo-proxy-service"
                        },
                        {
                            "value": "elluri"
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:30:59Z"
                        }
                    ],
                    "subject": [
                        {
                            "value": "Lataamo-inbox"
                        }
                    ],
                    "description": [
                        {
                            "value": "Lataamo-inbox series for elluri"
                        }
                    ],
                    "publisher": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "language": [
                        {
                            "value": "en"
                        }
                    ],
                    "title": [
                        {
                            "value": "inbox elluri"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_2_ID
                        }
                    ],
                    "contributor": [
                        {
                            "value": "grp-4apis, elluri, konttine"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T11:33:23Z"
                        }
                    ],
                    "description": [
                        {
                            "value": "testisarja"
                        }
                    ],
                    "title": [
                        {
                            "value": "orbu dorbu"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "rightsHolder": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "identifier": [
                        {
                            "value": "28ed5c64-5de5-4c0a-8edd-a536c857d847"
                        }
                    ],
                    "creator": [
                        {
                            "value": "Lataamo-proxy-service"
                        },
                        {
                            "value": "elluri"
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:30:57Z"
                        }
                    ],
                    "subject": [
                        {
                            "value": "Lataamo-trash"
                        }
                    ],
                    "description": [
                        {
                            "value": "Lataamo-trash series for elluri"
                        }
                    ],
                    "publisher": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "language": [
                        {
                            "value": "en"
                        }
                    ],
                    "title": [
                        {
                            "value": "trash elluri"
                        }
                    ]
                }
            }
        ],
        "totalCount": "4"
    };

const userSeriesListFromOpenCastTrashInboxPlus1 =
    {
        "catalogs": [
            {
                "http://purl.org/dc/terms/": {
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_1_ID
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        },
                        {
                            "value": "jesbu"
                        },
                        {
                            "value": "grp-XYZ"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:33:08Z"
                        }
                    ],
                    "description": [
                        {
                            "value": "Kontributor kontribuutio"
                        }
                    ],
                    "title": [
                        {
                            "value": "Hesbu sarja"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "rightsHolder": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_2_ID
                        }
                    ],
                    "creator": [
                        {
                            "value": "Lataamo-proxy-service"
                        },
                        {
                            "value": "elluri"
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:30:59Z"
                        }
                    ],
                    "subject": [
                        {
                            "value": "Lataamo-inbox"
                        }
                    ],
                    "description": [
                        {
                            "value": "Lataamo-inbox series for elluri"
                        }
                    ],
                    "publisher": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "language": [
                        {
                            "value": "en"
                        }
                    ],
                    "title": [
                        {
                            "value": "inbox elluri"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "rightsHolder": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "identifier": [
                        {
                            "value": "28ed5c64-5de5-4c0a-8edd-a536c857d847"
                        }
                    ],
                    "creator": [
                        {
                            "value": "Lataamo-proxy-service"
                        },
                        {
                            "value": "elluri"
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:30:57Z"
                        }
                    ],
                    "subject": [
                        {
                            "value": "Lataamo-trash"
                        }
                    ],
                    "description": [
                        {
                            "value": "Lataamo-trash series for elluri"
                        }
                    ],
                    "publisher": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "language": [
                        {
                            "value": "en"
                        }
                    ],
                    "title": [
                        {
                            "value": "trash elluri"
                        }
                    ]
                }
            }
        ],
        "totalCount": "3"
    };

const mockUserSeriesThreeStycken =
    {
        "catalogs": [
            {
                "http://purl.org/dc/terms/": {
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_1_ID
                        }
                    ],
                    "contributor": [
                        {
                            "value": "Tester-XYZ"
                        },
                        {
                            "value": "grp-lataamo-6"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:33:08Z"
                        }
                    ],
                    "description": [
                        {
                            "value": "Kontributor kontribuutio"
                        }
                    ],
                    "title": [
                        {
                            "value": "Hesbu sarja"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_2_ID
                        }
                    ],
                    "contributor": [
                        {
                            "value": "Tester-XYZ"
                        },
                        {
                            "value": "grp-lataamo-6"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:33:08Z"
                        }
                    ],
                    "description": [
                        {
                            "value": "Kontributor kontribuutio"
                        }
                    ],
                    "title": [
                        {
                            "value": "Hasbu sarja"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_3_ID
                        }
                    ],
                    "contributor": [
                        {
                            "value": "jesbu"
                        },
                        {
                            "value": "grp-lataamo-6"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:33:08Z"
                        }
                    ],
                    "description": [
                        {
                            "value": "Kontributor kontribuutio"
                        }
                    ],
                    "title": [
                        {
                            "value": "Husba sarja"
                        }
                    ]
                }
            }
        ],
        "totalCount": "3"
    };

const userSeriesListFromOpenCastJust1 =
    {
        "catalogs": [
            {
                "http://purl.org/dc/terms/": {
                    "identifier": [
                        {
                            "value": CONSTANTS.TEST_SERIES_1_ID
                        }
                    ],
                    "contributor": [
                        {
                            "value": "jesbu"
                        },
                        {
                            "value": "grp-oppuroomu"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:33:08Z"
                        }
                    ],
                    "description": [
                        {
                            "value": "Kontributor kontribuutio"
                        }
                    ],
                    "title": [
                        {
                            "value": "Hesbu sarja"
                        }
                    ]
                }
            }
        ],
        "totalCount": "1"
    };


const userSeriesListFromOpenCastTrashInbox =
    {
        "catalogs": [
            {
                "http://purl.org/dc/terms/": {
                    "rightsHolder": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "identifier": [
                        {
                            "value": "06bd63f5-4a66-45c5-826f-e5a195c364ad"
                        }
                    ],
                    "creator": [
                        {
                            "value": "Lataamo-proxy-service"
                        },
                        {
                            "value": "elluri"
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:30:59Z"
                        }
                    ],
                    "subject": [
                        {
                            "value": "Lataamo-inbox"
                        }
                    ],
                    "description": [
                        {
                            "value": "Lataamo-inbox series for elluri"
                        }
                    ],
                    "publisher": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "language": [
                        {
                            "value": "en"
                        }
                    ],
                    "title": [
                        {
                            "value": "inbox elluri"
                        }
                    ]
                }
            },
            {
                "http://purl.org/dc/terms/": {
                    "rightsHolder": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "identifier": [
                        {
                            "value": "28ed5c64-5de5-4c0a-8edd-a536c857d847"
                        }
                    ],
                    "creator": [
                        {
                            "value": "Lataamo-proxy-service"
                        },
                        {
                            "value": "elluri"
                        }
                    ],
                    "contributor": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "created": [
                        {
                            "type": "dcterms:W3CDTF",
                            "value": "2021-04-06T10:30:57Z"
                        }
                    ],
                    "subject": [
                        {
                            "value": "Lataamo-trash"
                        }
                    ],
                    "description": [
                        {
                            "value": "Lataamo-trash series for elluri"
                        }
                    ],
                    "publisher": [
                        {
                            "value": "elluri"
                        }
                    ],
                    "language": [
                        {
                            "value": "en"
                        }
                    ],
                    "title": [
                        {
                            "value": "trash elluri"
                        }
                    ]
                }
            }
        ],
        "totalCount": "2"
    };

exports.mockOpencastSeriesApiEmptyResult_XXX = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=Tester-XYZ&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, mockUserSeriesEmpty_XXX);

exports.mockOpencastSeriesApiEmptyResult_XXX_2 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=grp-XYZ&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, mockUserSeriesEmpty_XXX);

exports.mockSeriesWithInboxCall_XXX = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=tester-xyz&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, mockUserInboxSeries3_XXX);

exports.mockUserSeriesListCall_elluri_XXX = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=elluri&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, userSeriesListFromOpenCastTrashInboxPlus2);

exports.mockUserSeriesListCall_elluri_XXX2 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=elluri&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, userSeriesListFromOpenCastTrashInbox);

exports.mockUserSeriesListCall_elluri_XXX3 = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=elluri&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, userSeriesListFromOpenCastTrashInboxPlus1);

exports.mockUserSeriesListCall_grp_oppuroomu_XXX = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=grp-oppuroomu&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, userSeriesListFromOpenCastJust1);

exports.mockUserSeriesListCall_grp_XYZ_XXX = () =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor=grp-XYZ&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, userSeriesListFromOpenCastTrashInboxPlus1);

exports.mockOpencastSeriesApiEmptyResultContributorParam_XXX = (contributor) =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor='+
            contributor +
            '&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, mockUserSeriesEmpty_XXX);


exports.mockOpencastSeriesApiResult3SeriesContributorParam_XXX = (contributor) =>
    nock(CONSTANTS.OCAST_BASE_URL)
        .get('/series/series.json?q=&edit=false&fuzzyMatch=false&seriesId=&seriesTitle=&creator=&contributor='+
            contributor +
            '&publisher=&rightsholder=&createdfrom=&createdto=&language=&license=&subject=&abstract=&description=&sort=&startPage=&count=')
        .reply(200, mockUserSeriesThreeStycken);
