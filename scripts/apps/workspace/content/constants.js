// http://docs.python-cerberus.org/en/stable/usage.html
export const DEFAULT_SCHEMA = Object.freeze({
    slugline: {maxlength: 24, type: 'string'},
    relatedItems: {},
    genre: {type: 'list'},
    anpa_take_key: {type: 'string'},
    place: {type: 'list'},
    priority: {type: 'integer'},
    urgency: {type: 'integer'},
    anpa_category: {type: 'list'},
    subject: {type: 'list'},
    company_codes: {type: 'list'},
    ednote: {type: 'string'},
    headline: {maxlength: 42, type: 'string', required: true},
    sms: {maxlength: 160, type: 'string'},
    abstract: {maxlength: 160, type: 'string'},
    body_html: {type: 'string'},
    byline: {type: 'string'},
    dateline: {type: 'dict'},
    sign_off: {type: 'string'},
    footer: {},
    body_footer: {type: 'string'}
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
    headline: {order: 11, formatOptions: ['underline', 'anchor', 'bold', 'removeFormat'], enabled: true},
    sms: {order: 12, enabled: true},
    abstract: {
        order: 13,
        formatOptions: ['bold', 'italic', 'underline', 'anchor', 'removeFormat'],
        enabled: true
    },
    byline: {order: 14, enabled: true},
    dateline: {order: 15, enabled: true},
    body_html: {
        order: 16,
        formatOptions: ['h2', 'bold', 'italic', 'underline', 'quote', 'anchor', 'embed', 'picture', 'removeFormat'],
        enabled: true
    },
    footer: {order: 17, enabled: true},
    body_footer: {order: 18, enabled: true},
    sign_off: {order: 19, enabled: true}
});

export const CV_ALIAS = Object.freeze({
    locators: 'place',
    categories: 'anpa_category'
});

export const EXTRA_SCHEMA_FIELDS = Object.freeze({
    feature_media: {},
    media_description: {}
});

export const EXTRA_EDITOR_FIELDS = Object.freeze({
    feature_media: {enabled: true},
    media_description: {enabled: true}
});
