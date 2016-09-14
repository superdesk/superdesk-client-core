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
    slugline: {order: 1, sdWidth: 'full'},
    genre: {order: 2, sdWidth: 'half'},
    anpa_take_key: {order: 3, sdWidth: 'half'},
    place: {order: 4, sdWidth: 'half'},
    priority: {order: 5, sdWidth: 'quarter'},
    urgency: {order: 6, sdWidth: 'quarter'},
    anpa_category: {order: 7, sdWidth: 'full'},
    subject: {order: 8, sdWidth: 'full'},
    company_codes: {order: 9, sdWidth: 'full'},
    ednote: {order: 10, sdWidth: 'full'},
    headline: {order: 11, formatOptions: ['underline', 'anchor', 'bold', 'removeFormat']},
    sms: {order: 12},
    abstract: {order: 13, formatOptions: ['bold', 'italic', 'underline', 'anchor', 'removeFormat']},
    byline: {order: 14},
    dateline: {order: 15},
    body_html: {
        order: 16,
        formatOptions: ['h2', 'bold', 'italic', 'underline', 'quote', 'anchor', 'embed', 'picture', 'removeFormat']
    },
    footer: {order: 17},
    body_footer: {order: 18},
    sign_off: {order: 19},
});

export const CV_ALIAS = Object.freeze({
    locators: 'place'
});

export const EXTRA_SCHEMA_FIELDS = Object.freeze({
    feature_media: {},
    media_description: {}
});

export const EXTRA_EDITOR_FIELDS = Object.freeze({
    feature_media: {},
    media_description: {}
});
