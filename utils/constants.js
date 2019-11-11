const INBOX = 'inbox';
const ESB_PERSONS_PATH = '/person/unitube/search/';
// esb service paths
const ESB_IAM_GROUPS_PATH = '/iam/group/unitube/search/';


const ROLE_ANONYMOUS = 'ROLE_ANONYMOUS';
const ROLE_KATSOMO = 'ROLE_KATSOMO';

const MOODLE_ACL_INSTRUCTOR = '_Instructor';
const MOODLE_ACL_LEARNER = '_Learner';
const STATUS_PUBLISHED = 'status_published';
const STATUS_PRIVATE = 'status_private';
const STATUS_MOODLE = 'status_moodle';

const VIDEO_PRESENTER_DELIVERY = 'presenter/delivery';
const VIDEO_PRESENTATION_DELIVERY = 'presentation/delivery';

// opencast service paths
const OCAST_API_PATH = '/api/';
const OCAST_SERIES_PATH = '/api/series/';
const OCAST_VIDEOS_PATH = '/api/events/';
const OCAST_USER_PATH = '/api/info/me';
const OCAST_VIDEO_PUBLICATION_PATH = '/publications';
const OCAST_EVENT_MEDIA_PATH_PREFIX = '/admin-ng/event/';
const OCAST_EVENT_MEDIA_PATH_SUFFIX = '/asset/media/media.json';
const OCAST_EVENT_MEDIA_FILE_METADATA = '/asset/media/';
const OCAST_ACL_PATH = '/acl';
const OCAST_METADATA_PATH = '/metadata';
const OCAST_TYPE_QUERY_PARAMETER = '?type=';
const OCAST_TYPE_DUBLINCORE_EPISODE = 'dublincore/episode';
const OCAST_TYPE_DUBLINCORE_SERIES = 'dublincore/series';

const OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER = '?filter=series:';

const OCAST_VIDEOS_FILTER_USER_NAME = '?filter=title:';

const UPDATE_SERIES = 'update_series';
const CREATE_SERIES = 'create_series';

const SERIES_ACL_TEMPLATE = [
    {
        "action": "read",
        "allow": true,
        "role": "ROLE_USER_LATAAMO_TESTI"
    },
    {
        "action": "write",
        "allow": true,
        "role": "ROLE_USER_LATAAMO_TESTI"
    }
];

const SERIES_ACL_TEST_TEMPLATE = [
    {
        "action": "read",
        "allow": true,
        "role": "ROLE_USER_KATSOMO_TESTI"
    }
];

const SERIES_ACL_TEMPLATE_TUOTANTO = [
    {
        "action": "read",
        "allow": true,
        "role": "ROLE_USER_LATAAMO_TUOTANTO"
    },
    {
        "action": "write",
        "allow": true,
        "role": "ROLE_USER_LATAAMO_TUOTANTO"
    }
];

const PROCESSING_METADATA = {
    "workflow": "schedule-and-upload",
    "configuration": {
        "flagForCutting": "false",
        "flagForReview": "false",
        "publishToEngage": "true",
        "publishToHarvesting": "true",
        "straightToPublishing": "true"
    }
};

const SERIES_CONTRIBUTORS_TEMPLATE = {
    "id": "contributor",
    "value": ""
};

const SERIES_ACL_TEMPLATE_READ_ENTRY = {
    "allow": true,
    "action": "read"
};

const SERIES_ACL_TEMPLATE_WRITE_ENTRY = {
    "allow": true,
    "action": "write"
};

const ADD_TO_IAM_GROUPS = ['grp-', 'hy-', 'sys-'];
const PUBLIC_ROLES = [ROLE_ANONYMOUS, ROLE_KATSOMO];

const SERIES_METADATA = [
    {
        "label": "Opencast Series DublinCore",
        "flavor": "dublincore/series",
        "fields": [
            {
                "id": "title",
                "value": ""
            },
            {
                "id": "description",
                "value": ""
            }
        ]
    }
];


// properties object for the republish query
// Opencast instantiates a java.util.Properties from the value, so key=value pairs and \n as a delimeter.
// https://docs.oracle.com/javase/7/docs/api/java/util/Properties.html#load(java.io.InputStream)
const PROPERTIES_REPUBLISH_METADATA =
    "publishLive=false\nuploadedSearchPreview=true\npublishToOaiPmh=true\ncomment=false\npublishToMediaModule=true";


module.exports = {
    ROLE_ANONYMOUS,
    ROLE_KATSOMO,
    ADD_TO_IAM_GROUPS,
    PUBLIC_ROLES,
    STATUS_PUBLISHED,
    STATUS_PRIVATE,
    STATUS_MOODLE,
    MOODLE_ACL_INSTRUCTOR,
    MOODLE_ACL_LEARNER,
    SERIES_ACL_TEMPLATE,
    OCAST_API_PATH,
    OCAST_SERIES_PATH,
    OCAST_VIDEOS_PATH,
    OCAST_USER_PATH,
    OCAST_VIDEO_PUBLICATION_PATH,
    OCAST_EVENT_MEDIA_PATH_PREFIX,
    OCAST_EVENT_MEDIA_PATH_SUFFIX,
    OCAST_EVENT_MEDIA_FILE_METADATA,
    OCAST_ACL_PATH,
    OCAST_METADATA_PATH,
    OCAST_VIDEOS_FILTER_SERIE_IDENTIFIER,
    OCAST_VIDEOS_FILTER_USER_NAME,
    PROCESSING_METADATA,
    OCAST_TYPE_QUERY_PARAMETER,
    OCAST_TYPE_DUBLINCORE_EPISODE,
    OCAST_TYPE_DUBLINCORE_SERIES,
    SERIES_METADATA,
    SERIES_CONTRIBUTORS_TEMPLATE,
    SERIES_ACL_TEMPLATE_READ_ENTRY,
    SERIES_ACL_TEMPLATE_WRITE_ENTRY,
    VIDEO_PRESENTER_DELIVERY,
    VIDEO_PRESENTATION_DELIVERY,
    UPDATE_SERIES,
    ESB_IAM_GROUPS_PATH,
    CREATE_SERIES,
    ESB_PERSONS_PATH,
    PROPERTIES_REPUBLISH_METADATA,
    SERIES_ACL_TEMPLATE_TUOTANTO,
    SERIES_ACL_TEST_TEMPLATE,
    INBOX
};
