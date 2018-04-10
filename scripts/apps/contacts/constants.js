
/**
 * Default list of fields
 */
export const DEFAULT_LIST_CONFIG = {
    firstLine: [
        'ContactName',
        'JobTitle',
        'OrgName',
        'Notes',
        'Email',
        'Phone',
        'VersionCreated'
    ],
    secondLine: [
        'State'
    ],
    singleLine: [
        'ContactName',
        'JobTitle',
        'OrgName',
        'Notes',
        'Email',
        'Phone',
        'State',
        'VersionCreated'
    ]
};

export const KEYCODES = {
    BACKSPACE: 8,
    ENTER: 13,
    ESCAPE: 27,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
};

/**
 * Lookup fields for at least one of them should be provided
 */
export const LOOKUP_FIELDS = [
    'mobile',
    'contact_phone',
    'contact_email',
    'twitter',
    'facebook',
    'instagram'
];

export const FB_URL = 'https://www.facebook.com/';
export const IG_URL = 'https://www.instagram.com/';

/**
 * Message to display for required field.
 */
export const MSG_REQUIRED = 'This field is required.';

export const MAILTO_URL = 'mailto://';