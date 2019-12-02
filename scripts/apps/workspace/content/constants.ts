import {gettext} from 'core/utils';

// http://docs.python-cerberus.org/en/stable/usage.html
export const DEFAULT_SCHEMA = Object.freeze({
    slugline: {maxlength: 24, type: 'string', required: true},
    relatedItems: {},
    genre: {type: 'list'},
    anpa_take_key: {type: 'string'},
    place: {type: 'list'},
    priority: {type: 'integer'},
    urgency: {type: 'integer'},
    anpa_category: {type: 'list', required: true},
    subject: {type: 'list', required: true},
    company_codes: {type: 'list'},
    ednote: {type: 'string'},
    headline: {maxlength: 42, type: 'string', required: true},
    sms: {maxlength: 160, type: 'string'},
    abstract: {maxlength: 160, type: 'string'},
    body_html: {required: true, type: 'string'},
    byline: {type: 'string'},
    dateline: {type: 'dict', required: false},
    sign_off: {type: 'string'},
    footer: {},
    body_footer: {type: 'string'},
});

export const DEFAULT_EDITOR = Object.freeze({
    slugline: {order: 1, sdWidth: 'full', enabled: true},
    genre: {order: 2, sdWidth: 'half', enabled: true},
    anpa_take_key: {order: 3, sdWidth: 'half', enabled: true},
    place: {order: 4, sdWidth: 'half', enabled: true},
    priority: {order: 5, sdWidth: 'quarter', enabled: true},
    urgency: {order: 6, sdWidth: 'quarter', enabled: true},
    anpa_category: {order: 7, sdWidth: 'full', enabled: true},
    subject: {order: 8, sdWidth: 'full', enabled: true},
    company_codes: {order: 9, sdWidth: 'full', enabled: true},
    ednote: {order: 10, sdWidth: 'full', enabled: true},
    headline: {order: 11, formatOptions: ['underline', 'link', 'bold'], enabled: true},
    sms: {order: 12, enabled: true},
    abstract: {
        order: 13,
        formatOptions: ['bold', 'italic', 'underline', 'link'],
        enabled: true,
    },
    byline: {order: 14, enabled: true},
    dateline: {order: 15, enabled: true},
    body_html: {
        order: 16,
        formatOptions: ['h2', 'bold', 'italic', 'underline', 'quote', 'link', 'embed', 'media'],
        enabled: true,
    },
    footer: {order: 17, enabled: true},
    body_footer: {order: 18, enabled: true},
    sign_off: {order: 19, enabled: true},
});

// labelMap maps schema entry keys to their display names.
export const GET_LABEL_MAP = () => ({
    'package-story-labels': gettext('Package story labels'),
    abstract: gettext('Abstract'),
    alt_text: gettext('Alt text'),
    anpa_category: gettext('ANPA Category'),
    anpa_take_key: gettext('Take Key'),
    archive_description: gettext('Archive description'),
    attachments: gettext('Attachments'),
    body_footer: gettext('Body footer'),
    body_html: gettext('Body HTML'),
    byline: gettext('Byline'),
    categories: gettext('Categories'),
    company_codes: gettext('Company Codes'),
    copyrightholder: gettext('Copyright holder'),
    copyrightnotice: gettext('Copyright notice'),
    dateline: gettext('Dateline'),
    description_text: gettext('Description'),
    desk: gettext('Desk'),
    ednote: gettext('Ed. Note'),
    embargo: gettext('Embargo'),
    feature_image: gettext('Feature Image'),
    feature_media: gettext('Feature Media'),
    footer: gettext('Footer'),
    footers: gettext('Footers'),
    genre: gettext('Genre'),
    headline: gettext('Headline'),
    ingest_provider: gettext('Ingest Provider'),
    keywords: gettext('Keywords'),
    language: gettext('Language'),
    media: gettext('Media'),
    media_description: gettext('Media Description'),
    place: gettext('Place'),
    priority: gettext('Priority'),
    publish_schedule: gettext('Scheduled Time'),
    relatedItems: gettext('Related Items'),
    sign_off: gettext('Sign Off'),
    slugline: gettext('Slugline'),
    sms: gettext('SMS'),
    sms_message: gettext('SMS Message'),
    source: gettext('Source'),
    stage: gettext('Stage'),
    subject: gettext('Subject'),
    type: gettext('Type'),
    urgency: gettext('Urgency'),
    usageterms: gettext('Usage Terms'),
});

export const CV_ALIAS = Object.freeze({
    locators: 'place',
    categories: 'anpa_category',
});

export const EXTRA_SCHEMA_FIELDS = Object.freeze({
    feature_media: {},
    media_description: {},
});

export const EXTRA_EDITOR_FIELDS = Object.freeze({
    feature_media: {enabled: true},
    media_description: {enabled: true},
});

/**
 * Vocabulary types used for custom fields
 */
export const CUSTOM_FIELD_TYPES = [
    'text',
    'date',
    'media',
    'embed',
    'urls',
    'custom',
];
