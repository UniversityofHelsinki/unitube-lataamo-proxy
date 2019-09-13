
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

const ACL_ARRAY = [
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
    },
    {
      "action": "read",
      "allow": true,
      "role": "ROLE_ANONYMOUS"
    }
  ]

  const PROCESSING_METADATA = {
    "workflow": "schedule-and-upload",
    "configuration": {
      "flagForCutting": "false",
      "flagForReview": "true",
      "publishToEngage": "true",
      "publishToHarvesting": "true",
      "straightToPublishing": "true"
    }
  }   

module.exports = {
    ROLE_ANONYMOUS,
    STATUS_PUBLISHED,
    STATUS_MOODLE,
    MOODLE_ACL_INSTRUCTOR,
    MOODLE_ACL_LEARNER,
    ACL_ARRAY,
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
    OCAST_TYPE_DUBLINCORE_SERIES
};