
/**
  * Global search parameters and label mapping.
 */
export const PARAMETERS = Object.freeze({
    unique_name: 'Unique Name',
    original_creator: 'Creator',
    from_desk: 'From Desk',
    to_desk: 'To Desk',
    spike: 'In Spiked',
    subject: 'Subject',
    company_codes: 'Company Codes',
    ingest_provider: 'Provider'
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
    notsms: 'Not Sms'
});

/**
 * Default list of fields
 */
export const DEFAULT_LIST_CONFIG = {
    priority: [
        'priority',
        'urgency'
    ],
    firstLine: [
        'wordcount',
        'slugline',
        'highlights',
        'headline',
        'versioncreated'
    ],
    secondLine: [
        'profile',
        'state',
        'embargo',
        'update',
        'takekey',
        'takepackage',
        'signal',
        'broadcast',
        'flags',
        'updated',
        'category',
        'provider',
        'expiry',
        'desk',
        'fetchedDesk'
    ]
};

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
        'package_type',
        'item_id',
        '_current_version',
        'lock_user',
        'lock_session',
        'genre',
        'source',
        'last_published_version',
        'archived'
    ]
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
    versioncreated: 'versioncreated'
};
