// esb service paths
const ESB_IAM_GROUPS_PATH = '/iam/group/unitube/search/';

const ROLE_ANONYMOUS = 'ROLE_ANONYMOUS';

const MOODLE_ACL_INSTRUCTOR = '_Instructor';
const MOODLE_ACL_LEARNER = '_Learner';
const STATUS_PUBLISHED = 'status_published';
const STATUS_MOODLE = 'status_moodle';

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

const UPDATE_SERIES = 'update_series';
const CREATE_SERIES = 'create_series';

const SERIES_ACL_TEMPLATE = [
    {
        "action": "read",
        "allow": true,
        "role": "ROLE_USER_ADMIN"
    },
    {
        "action": "write",
        "allow": true,
        "role": "ROLE_USER_ADMIN"
    },
    {
        "action": "read",
        "allow": true,
        "role": "ROLE_ADMIN"
    },
    {
        "action": "write",
        "allow": true,
        "role": "ROLE_ADMIN"
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

module.exports = {
    ROLE_ANONYMOUS,
    STATUS_PUBLISHED,
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
    PROCESSING_METADATA,
    OCAST_TYPE_QUERY_PARAMETER,
    OCAST_TYPE_DUBLINCORE_EPISODE,
    OCAST_TYPE_DUBLINCORE_SERIES,
    OCAST_TYPE_DUBLINCORE_EPISODE,
    SERIES_METADATA,
    SERIES_CONTRIBUTORS_TEMPLATE,
    SERIES_ACL_TEMPLATE_READ_ENTRY,
    SERIES_ACL_TEMPLATE_WRITE_ENTRY,
    UPDATE_SERIES,
    CREATE_SERIES,
    ESB_IAM_GROUPS_PATH
};