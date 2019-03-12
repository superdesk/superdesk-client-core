import _ from 'lodash';
import {stripHtmlTags} from 'core/utils';
import {META_FIELD_NAME, fieldsMetaKeys, getFieldMetadata} from 'core/editor3/helpers/fieldsMeta';
import {isSuggestion, isComment} from 'core/editor3/highlightsConfig';

export const CONTENT_FIELDS_DEFAULTS = Object.freeze({
    headline: '',
    slugline: '',
    body_html: '',
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
    [META_FIELD_NAME]: {},
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
    resend: false,
    set_label: true,
    takedown: false,
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

        elem.innerHTML = content;
        return stripHtmlTags(elem.textContent);
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

    return item;
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
 * @param item
 */
export function stripWhitespaces(item) {
    var fields = ['headline', 'slugline', 'anpa_take_key', 'sms_message', 'abstract'];

    _.each(fields, (key) => {
        if (angular.isDefined(item[key])) {
            item[key] = removeWhitespaces(item[key]);
        }
    });
}

/**
 * Check if the item has at least one style of type suggestion
 */
export function itemHasUnresolvedHighlight(item, isHighlightFn) {
    return Object.keys(item[META_FIELD_NAME] || {})
        .map((contentKey) => getFieldMetadata(item, contentKey, fieldsMetaKeys.draftjsState))
        .filter((draftjsState) => draftjsState != null)
        .some((draftjsState) => (draftjsState.blocks || [])
            .some((block) => (block.inlineStyleRanges || [])
                .some((inlineStyleRange) => isHighlightFn(inlineStyleRange.style)),
            ),
        );
}

export function itemHasUnresolvedSuggestions(item) {
    return itemHasUnresolvedHighlight(item, isSuggestion);
}

export function itemHasUnresolvedComments(item) {
    return itemHasUnresolvedHighlight(item, isComment);
}

/**
 * Removes renditions from previously used image(s)
 * @param {object} update
 * @param {object} origItem
 */
export function cutoffPreviousRenditions(update, origItem) {
    const defaultRenditions = ['original', 'baseImage', 'thumbnail', 'viewImage'];
    let updateRenditions = null;
    let origRenditions = null;

    if (!('associations' in origItem)) {
        return;
    }

    Object.keys(origItem.associations).forEach((key) => {
        try {
            updateRenditions = update.associations[key].renditions;
            origRenditions = origItem.associations[key].renditions;
            if (updateRenditions == null || origRenditions == null) {
                return;
            }

            if (updateRenditions.original == null && origRenditions.original == null) {
                return; // external image
            }
        } catch (error) {
            if (error instanceof TypeError) {
                return;
            }
            throw error;
        }

        // image was changed
        if (updateRenditions.original.href !== origRenditions.original.href) {
            // walk through all renditions
            Object.keys(origRenditions).forEach((key) => {
                // ignore default renditions, because all images have default renditions
                if (!(key in defaultRenditions) &&
                    key in updateRenditions &&
                    origRenditions[key] !== null &&
                    // image was changed, but rendition(s) still equal
                    origRenditions[key].href === updateRenditions[key].href) {
                    // remove rendition from previously used image
                    delete updateRenditions[key];
                }
            });
        }
    });
}
