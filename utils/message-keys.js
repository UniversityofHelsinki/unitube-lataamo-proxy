// error message keys
const ERROR_MESSAGE_FAILED_TO_GET_USER = 'error_failed_to_get_user';
const ERROR_MESSAGE_FAILED_TO_GET_EVENT_DETAILS = 'error_failed_to_get_event';
const ERROR_MESSAGE_FAILED_TO_GET_EVENT_DELETION_DATE = 'error_failed_to_get_event_deletion_date';
const ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DELETION_DATE = 'error_failed_to_update_deletion_date';
const ERROR_MESSAGE_FAILED_TO_GET_EVENT_FOR_UPDATE_DELETION_DATE = 'error_failed_to_get_event_for_update_deletion_date';
const SUCCESS_MESSAGE_TO_UPDATE_EVENT_DELETION_DATE = 'success_to_update_deletion_date';
const ERROR_MESSAGE_FAILED_TO_GET_EVENT_VIDEO_URL = 'error-failed-to-get-event-video-url';
const ERROR_MESSAGE_FAILED_TO_GET_SERIES_DETAILS = 'error-failed-to-get-series-details';
const ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_DETAILS = 'error-failed-to-update-series-details';
const ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_ACLS = 'error-failed-to-update-series-acls';
const ERROR_MESSAGE_FAILED_TO_GET_SERIES_LIST_FOR_USER = 'error-failed-to-get-series-list-for-user';
const ERROR_MESSAGE_FAILED_TO_GET_EVENT_LIST_FOR_USER = 'error-failed-to-get-event-list-for-user';
const ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO = 'error-failed-to-upload-video';
const ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DETAILS = 'error-failed-to-update-event-details';
const ERROR_MESSAGE_FAILED_TO_MOVE_EVENT_TO_TRASH ='error-failed-to-move-event-to-trash';
const ERROR_MESSAGE_FAILED_TO_SAVE_SERIES = 'error-failed-to-save-series';
const ERROR_MESSAGE_FAILED_TO_DELETE_SERIES = 'error-failed-to-delete-series';
const ERROR_MESSAGE_FAILED_TO_GET_IAM_GROUPS = 'error-failed-to-get-iam-groups';
const ERROR_MESSAGE_FAILED_TO_GET_PERSONS = 'error-failed-to-get-iam-persons';
const ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED = 'error_failed_to_save_series_inbox_not_allowed';
const ERROR_MESSAGE_FAILED_TO_DELETE_SERIES_INBOX_NOT_ALLOWED = 'error_failed_to_delete_series_inbox_not_allowed';
const ERROR_MESSAGE_FAILED_TO_DELETE_SERIES_TRASH_NOT_ALLOWED = 'error_failed_to_delete_series_trash_not_allowed';
const ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_INBOX_NOT_ALLOWED = 'error_message_failed_to_update_series_inbox_not_allowed';
const ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_TRASH_NOT_ALLOWED = 'error_message_failed_to_update_series_trash_not_allowed';
const ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_TRASH_NOT_ALLOWED = 'error_failed_to_save_series_trash_not_allowed';
const ERROR_MESSAGE_FAILED_TO_GET_INBOX_EVENTS = 'error-failed-to-get-inbox-events';
const ERROR_MESSAGE_FAILED_TO_GET_TRASH_EVENTS = 'error-failed-to-get-trash-events';
const ERROR_MESSAGE_FAILED_TO_DOWNLOAD_VIDEO = 'error-failed-to-download-video';
const ERROR_MESSAGE_FAILED_TO_GET_JOB = 'error-failed-to-get-job';
const ERROR_MESSAGE_FAILED_TO_PLAY_VIDEO_FROM_URL = 'error-failed-to-play-video-from-url';
const SUCCESS_MESSAGE_VIDEO_UPLOAD = 'success-video-sent-to-opencast';
const ERROR_MALFORMED_WEBVTT_FILE = 'error-vtt-file-malformed';
const SUCCESS_WEBVTT_UPLOAD = 'success-vtt-file-upload';
const ERROR_LIMIT_FILE_SIZE = 'error-limit-file-size';
const ERROR_WEBVTT_FILE_UPLOAD = 'error-webvtt-file-upload';
const ERROR_MESSAGE_FAILED_TO_GENERATE_AUTOMATIC_TRANSCRIPTIONS_FOR_VIDEO = 'error-failed-to-generate-automatic-transcriptions-for-video';
const ERROR_MESSAGE_MISSING_VIDEO_ID_OR_TRANSLATION_MODEL_OR_TRANSLATION_LANGUAGE = 'error-missing-video-id-or-translation-model-or-translation-language';
const ERROR_MESSAGE_FAILED_TO_GET_EVENT_COVER_IMAGE = 'error-failed-to-get-event-cover-image';
const ERROR_MESSAGE_FAILED_TO_GET_RELEASE_NOTES = 'error-failed-to-get-release-notes';

module.exports = {
    ERROR_MESSAGE_FAILED_TO_GET_USER,
    ERROR_MESSAGE_FAILED_TO_GET_EVENT_DETAILS,
    ERROR_MESSAGE_FAILED_TO_GET_EVENT_DELETION_DATE,
    ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DELETION_DATE,
    ERROR_MESSAGE_FAILED_TO_GET_EVENT_FOR_UPDATE_DELETION_DATE,
    SUCCESS_MESSAGE_TO_UPDATE_EVENT_DELETION_DATE,
    ERROR_MESSAGE_FAILED_TO_GET_EVENT_VIDEO_URL,
    ERROR_MESSAGE_FAILED_TO_PLAY_VIDEO_FROM_URL,
    ERROR_MESSAGE_FAILED_TO_GET_SERIES_DETAILS,
    ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_DETAILS,
    ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_ACLS,
    ERROR_MESSAGE_FAILED_TO_GET_SERIES_LIST_FOR_USER,
    ERROR_MESSAGE_FAILED_TO_GET_EVENT_LIST_FOR_USER,
    ERROR_MESSAGE_FAILED_TO_UPLOAD_VIDEO,
    ERROR_MESSAGE_FAILED_TO_UPDATE_EVENT_DETAILS,
    ERROR_MESSAGE_FAILED_TO_MOVE_EVENT_TO_TRASH,
    ERROR_MESSAGE_FAILED_TO_SAVE_SERIES,
    ERROR_MESSAGE_FAILED_TO_DELETE_SERIES,
    ERROR_MESSAGE_FAILED_TO_GET_IAM_GROUPS,
    ERROR_MESSAGE_FAILED_TO_GET_PERSONS,
    SUCCESS_MESSAGE_VIDEO_UPLOAD,
    ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_INBOX_NOT_ALLOWED,
    ERROR_MESSAGE_FAILED_TO_DELETE_SERIES_INBOX_NOT_ALLOWED,
    ERROR_MESSAGE_FAILED_TO_DELETE_SERIES_TRASH_NOT_ALLOWED,
    ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_TRASH_NOT_ALLOWED,
    ERROR_MESSAGE_FAILED_TO_UPDATE_SERIES_INBOX_NOT_ALLOWED,
    ERROR_MESSAGE_FAILED_TO_GET_INBOX_EVENTS,
    ERROR_MESSAGE_FAILED_TO_DOWNLOAD_VIDEO,
    ERROR_MESSAGE_FAILED_TO_GET_TRASH_EVENTS,
    ERROR_MESSAGE_FAILED_TO_SAVE_SERIES_TRASH_NOT_ALLOWED,
    ERROR_MALFORMED_WEBVTT_FILE,
    SUCCESS_WEBVTT_UPLOAD,
    ERROR_LIMIT_FILE_SIZE,
    ERROR_WEBVTT_FILE_UPLOAD,
    ERROR_MESSAGE_FAILED_TO_GET_JOB,
    ERROR_MESSAGE_FAILED_TO_GENERATE_AUTOMATIC_TRANSCRIPTIONS_FOR_VIDEO,
    ERROR_MESSAGE_MISSING_VIDEO_ID_OR_TRANSLATION_MODEL_OR_TRANSLATION_LANGUAGE,
    ERROR_MESSAGE_FAILED_TO_GET_EVENT_COVER_IMAGE,
    ERROR_MESSAGE_FAILED_TO_GET_RELEASE_NOTES
};
