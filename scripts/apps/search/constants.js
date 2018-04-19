
/**
  * Global search parameters and label mapping.
 */
export const PARAMETERS = Object.freeze({
    unique_name: 'Unique Name',
    original_creator: 'Creator',
    from_desk: 'From Desk',
    to_desk: 'To Desk',
    spike: 'Spiked',
    subject: 'Subject',
    company_codes: 'Company Codes',
    marked_desks: 'Marked Desks',
    ingest_provider: 'Provider',
    featuremedia: 'Associated Feature Media',
    subscriber: 'Subscriber',
});

/**
 * Facet field and label mapping and used when facets are removed.
 */
export const EXCLUDE_FACETS = Object.freeze({
    notdesk: 'Not Desk',
    nottype: 'Not Type',
    notgenre: 'Not Genre',
    notcategory: 'Not Category',
    noturgency: 'Not Urgency',
    notsource: 'Not Source',
    notpriority: 'Not Priority',
    notlegal: 'Not Legal',
    notsms: 'Not Sms',
    notlanguage: 'Not Language',
});

/**
 * Default list of fields
 */
export const DEFAULT_LIST_CONFIG = {
    priority: [
        'priority',
        'urgency',
    ],
    firstLine: [
        'wordcount',
        'slugline',
        'highlights',
        'markedDesks',
        'associations',
        'publish_queue_errors',
        'headline',
        'versioncreated',
    ],
    secondLine: [
        'profile',
        'state',
        'embargo',
        'update',
        'takekey',
        'signal',
        'broadcast',
        'flags',
        'updated',
        'category',
        'provider',
        'expiry',
        'desk',
        'fetchedDesk',
    ],
};

export const DEFAULT_GRID_VIEW_FIELDS_CONFIG = [
    'source',
];

/**
 * Core list of fields that has to be returned in search results
 * for core functionality to work
 */
export const CORE_PROJECTED_FIELDS = {
    fields: [
        'highlights',
        '_created',
        '_updated',
        '_etag',
        '_type',
        'state',
        'embargo',
        'publish_schedule',
        'broadcast',
        'flags',
        'rewrite_of',
        'rewritten_by',
        'expiry',
        'task',
        'type',
        'linked_in_packages',
        'renditions',
        'item_id',
        'guid',
        '_current_version',
        'lock_user',
        'lock_session',
        'genre',
        'source',
        'language',
        'last_published_version',
        'archived',
        'associations',
        'queue_state',
        'alt_text',
        'description_text',
        'assignment_id',

        // Added in order not to lose data while drag-and-droping an image to the body | SDESK-1508
        'byline',
        'copyrightholder',
        'copyrightnotice',
        'usageterms',
    ],
};

/**
 * Mappings of UI fields to schema fields for projection
 */
export const UI_PROJECTED_FIELD_MAPPINGS = {
    priority: 'priority',
    urgency: 'urgency',
    wordcount: 'word_count',
    slugline: 'slugline',
    headline: 'headline',
    profile: 'profile',
    signal: 'signal',
    takekey: 'anpa_take_key',
    update: 'correction_sequence',
    provider: 'ingest_provider',
    category: 'anpa_category',
    versioncreator: 'version_creator',
    versioncreated: 'versioncreated',
    markedDesks: 'marked_desks',
    queueError: 'error_message',
};
