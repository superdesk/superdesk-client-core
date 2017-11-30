export const CONTENT_FIELDS_DEFAULTS = Object.freeze({
    headline: '',
    slugline: '',
    body_html: '',
    editor_state: undefined,
    abstract: '',
    anpa_take_key: null,
    byline: '',
    urgency: null,
    priority: null,
    subject: [],
    anpa_category: [],
    genre: null,
    groups: null,
    usageterms: null,
    ednote: null,
    authors: [],
    place: [],
    dateline: {},
    language: null,
    unique_name: '',
    keywords: [],
    description_text: null,
    sign_off: null,
    publish_schedule: null,
    flags: null,
    pubstatus: null,
    target_regions: [],
    target_types: [],
    target_subscribers: [],
    embargo: null,
    renditions: {},
    associations: {},
    body_footer: '',
    company_codes: [],
    schedule_settings: null,
    sms_message: null,
    poi: {},
    profile: null,
    format: 'HTML',
    alt_text: null,
    copyrightnotice: null,
    copyrightholder: null,
    archive_description: null,
    extra: {},
    attachments: null,
    semantics: null,
    annotations: null,
});

export const DEFAULT_ACTIONS = Object.freeze({
    publish: false,
    correct: false,
    kill: false,
    deschedule: false,
    new_take: false,
    re_write: false,
    save: false,
    edit: false,
    mark_item: false,
    duplicate: false,
    copy: false,
    view: true,
    spike: false,
    unspike: false,
    package_item: false,
    multi_edit: false,
    send: false,
    create_broadcast: false,
    add_to_current: false,
    resend: false
});

/**
 * Extend content of dest
 *
 * @param {Object} dest
 * @param {Object} src
 */
export function extendItem(dest, src) {
    return angular.extend(dest, _.pick(src, _.keys(CONTENT_FIELDS_DEFAULTS)));
}

/**
 * Filter out default values from diff
 *
 * @param {Object} diff
 * @param {Object} orig
 */
export function filterDefaultValues(diff, orig) {
    Object.keys(CONTENT_FIELDS_DEFAULTS).forEach((key) => {
        if (diff.hasOwnProperty(key) && angular.equals(diff[key], CONTENT_FIELDS_DEFAULTS[key]) &&
            !orig.hasOwnProperty(key)) {
            delete diff[key];
        }
    });
}

export function stripHtmlRaw(content) {
    if (content) {
        var elem = document.createElement('div');
        var htmlRegex = /(<([^>]+)>)/ig;

        elem.innerHTML = content;
        return elem.textContent.replace(htmlRegex, '');
    }
    return '';
}

export function stripHtml(item) {
    var fields = ['headline'];

    _.each(fields, (key) => {
        if (angular.isDefined(item[key])) {
            item[key] = stripHtmlRaw(item[key]);
        }
    });
}

/**
 * Extend content of dest by forcing 'default' values
 * if the value doesn't exist in src
 *
 * @param {Object} dest
 * @param {Object} src
 */
export function forcedExtend(dest, src) {
    _.each(CONTENT_FIELDS_DEFAULTS, (value, key) => {
        if (dest[key]) {
            if (src[key]) {
                dest[key] = src[key];
            } else {
                dest[key] = value;
            }
        } else if (src[key]) {
            dest[key] = src[key];
        }
    });
}

/**
* Clean the given html by removing tags and embeds, in order to count words and characters later
*/
export function cleanHtml(data) {
    return data
    // remove embeds by using the comments around them. Embeds don't matter for word counters
        .replace(/<!-- EMBED START [\s\S]+?<!-- EMBED END .* -->/g, '')
        .replace(/<br[^>]*>/gi, '&nbsp;')
        .replace(/<\/?[^>]+><\/?[^>]+>/gi, ' ')
        .replace(/<\/?[^>]+>/gi, '')
        .trim()
        .replace(/&nbsp;/g, ' ');
}

/**
 * Removes whitespaces
 * @param data
 */
export function removeWhitespaces(data) {
    if (!data) {
        return data;
    }

    return data
        .replace(/&nbsp;/g, ' ')
        .replace(/\s\s+/g, ' ')
        .trim();
}


/**
 * Removes whitespaces for fields
 * @param data
 */
export function stripWhitespaces(item) {
    var fields = ['headline', 'slugline', 'anpa_take_key', 'sms_message', 'abstract'];

    _.each(fields, (key) => {
        if (angular.isDefined(item[key])) {
            item[key] = removeWhitespaces(item[key]);
        }
    });
}
