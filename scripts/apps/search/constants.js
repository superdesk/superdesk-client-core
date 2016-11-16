
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
    'priority': [
        'priority',
        'urgency'
    ],
    'firstLine': [
        'wordcount',
        'slugline',
        'highlights',
        'headline',
        'versioncreated'
    ],
    'secondLine': [
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
 * Default list of fields to be returned in search results
 */
export const DEFAULT_PROJECTED_FIELDS = {
    'fields': [
        'priority',
        'urgency',
        'word_count',
        'slugline',
        'highlights',
        'headline',
        'versioncreated',
        '_created',
        '_updated',
        '_etag',
        'profile',
        'state',
        'embargo',
        'publish_schedule',
        'signal',
        'broadcast',
        'flags',
        'rewrite_of',
        'rewritten_by',
        'source',
        'expiry',
        'task',
        'anpa_take_key',
        'type',
        'linked_in_packages',
        'renditions',
        'package_type',
        'correction_sequence',
        'item_id',
        '_current_version',
        'lock_user',
        'lock_session',
        'genre'
    ]
};
