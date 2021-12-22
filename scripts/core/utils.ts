import gettextjs from 'gettext.js';
import {debugInfo, getUserInterfaceLanguage} from 'appConfig';
import {IVocabularyItem, IArticle, IBaseRestApiResponse} from 'superdesk-api';
import {assertNever} from './helpers/typescript-helpers';
import {appConfig} from 'appConfig';
import {isObject, omit} from 'lodash';

export type IScopeApply = (fn: () => void) => void;

export const i18n = gettextjs();

export function stripHtmlTags(value) {
    const el = document.createElement('div');

    el.innerHTML = value;
    return el.innerText;
}

/** Does not mutate the original array. */
export function arrayInsert<T>(array: Array<T>, item: T, index: number): Array<T> {
    return array.slice(0, index).concat(item).concat(array.slice(index, array.length));
}

export const promiseAllObject = (promises) => new Promise((resolve, reject) => {
    const keys = Object.keys(promises);
    const promisesArray = keys.map((key) => promises[key]);

    return Promise.all(promisesArray)
        .then((promiseAllResults) => {
            const promiseResultsObject = keys.reduce((obj, key, i) => {
                obj[keys[i]] = promiseAllResults[i];
                return obj;
            }, {});

            resolve(promiseResultsObject);
        })
        .catch(reject);
});

/** Does not mutate the original array. */
export function arrayMove<T>(arr: Array<T>, from: number, to: number): Array<T> {
    if (
        from < 0 || from > arr.length - 1
        || to < 0 || to > arr.length - 1
    ) {
        console.error('Out of range.');
        return arr;
    }

    const copy = [...arr];

    const item = copy.splice(from, 1)[0];

    copy.splice(to, 0, item);

    return copy;
}

/**
 * Get superdesk supported type for data transfer if any
 *
 * @param {Event} event
 * @param {Boolean} supportExternalFiles
 * @return {string}
 */
export const getSuperdeskType = (event, supportExternalFiles = true) =>
    event.originalEvent.dataTransfer.types.find((name) =>
        name.includes('application/superdesk') || supportExternalFiles && name === 'Files',
    );

// example: gettext('Item was locked by {{user}}.', {user: 'John Doe'});
export const gettext = (
    text: string,
    params: {[key: string]: string | number} = {},
): string => {
    if (!text) {
        return '';
    }

    if (debugInfo.translationsLoaded !== true) {
        console.warn(
            `Invalid translation attempt for string "${text}": translation strings haven't been loaded yet.`
            + ' Original string will be displayed. \n' + new Error().stack.split('\n')[3].trim(),
        );
    }

    let translated = i18n.gettext(text);

    Object.keys(params ?? {}).forEach((param) => {
        translated = translated.replace(new RegExp(`{{\\s*${param}\\s*}}`, 'g'), params[param]);
    });

    return translated;
};

/*
    Example:

    gettextPlural(
        6,
        'Item was locked by {{user}}.',
        '{{count}} items were locked by multiple users.',
        {count: 6, user: 'John Doe'},
    );
*/
export const gettextPlural = (
    count: number,
    text: string,
    pluralText: string,
    params: {[key: string]: string | number} = {},
): string => {
    if (!text) {
        return '';
    }

    if (debugInfo.translationsLoaded !== true) {
        console.warn(
            `Invalid translation attempt for string "${text}": translation strings haven't been loaded yet.`
            + ' Original string will be displayed. \n' + new Error().stack.split('\n')[3].trim(),
        );
    }

    let translated = i18n.ngettext(text, pluralText, count);

    Object.keys(params ?? {}).forEach((param) => {
        translated = translated.replace(new RegExp(`{{\\s*${param}\\s*}}`), params[param]);
    });

    return translated;
};

/**
 * Escape given string for reg exp
 *
 * @url https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
 *
 * @param {string} string
 * @return {string}
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getVocabularyItemNameTranslated(term: IVocabularyItem, language?: string) {
    const _language = language ?? getUserInterfaceLanguage();

    // FIXME: Remove replacing _/- when language codes are normalized on the server.

    return term.translations?.name?.[_language]
        ?? term.translations?.name?.[_language.replace('_', '-')]
        ?? term.name;
}

export function translateArticleType(type: IArticle['type']) {
    switch (type) {
    case 'audio':
        return gettext('audio');
    case 'composite':
        return gettext('composite');
    case 'graphic':
        return gettext('graphic');
    case 'picture':
        return gettext('picture');
    case 'preformatted':
        return gettext('preformatted');
    case 'text':
        return gettext('text');
    case 'video':
        return gettext('video');
    default:
        assertNever(type);
    }
}

export function getUserSearchMongoQuery(searchString: string) {
    return {
        $or: [
            {username: {$regex: searchString, $options: '-i'}},
            {display_name: {$regex: searchString, $options: '-i'}},
            {first_name: {$regex: searchString, $options: '-i'}},
            {last_name: {$regex: searchString, $options: '-i'}},
            {email: {$regex: searchString, $options: '-i'}},
        ],
    };
}

export function getItemTypes() {
    const item_types = [
        {type: 'all', label: gettext('all')},
        {type: 'text', label: gettext('text')},
        {type: 'picture', label: gettext('picture')},
        {type: 'graphic', label: gettext('graphic')},
        {type: 'composite', label: gettext('package')},
        {type: 'highlight-pack', label: gettext('highlights package')},
        {type: 'video', label: gettext('video')},
        {type: 'audio', label: gettext('audio')},
    ];

    return item_types.filter(
        (item) => (
            appConfig.features.hideCreatePackage ?
                item.type !== 'composite' && item.type !== 'highlight-pack' :
                true
        ));
}

type IWeekday =
    'sunday'
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday';

export function getWeekDayIndex(weekday: IWeekday): number {
    return [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
    ].indexOf(weekday);
}

export function isElasticDateFormat(date: string) {
    return date.startsWith('now+') || date.startsWith('now-');
}

export function isScrolledIntoViewVertically(element: HTMLElement, container: HTMLElement): boolean {
    const elementTop = element.offsetTop;
    const elementBottom = element.offsetTop + element.offsetHeight;

    const topVisible = elementTop >= container.scrollTop;
    const bottomVisible = elementBottom < container.scrollTop + container.offsetHeight;

    return topVisible && bottomVisible;
}

/**
 * Note: `{a: false}` will be converted to '?a=false'.
 * If you need to exclude keys when value is `false`,
 * do so before passing the object to this function.
 */
export function toQueryString(
    params: {}, // key value pairs e.g. {}
): string {
    if (Object.keys(params).length < 1) {
        return '';
    }

    return '?' + Object.keys(params).map((key) =>
        `${key}=${isObject(params[key]) ? JSON.stringify(params[key]) : encodeURIComponent(params[key])}`,
    ).join('&');
}

/**
 * Output example: "1970-01-19T22:57:38"
 */
export function toServerDateFormat(date: Date): string {
    return date.toJSON().slice(0, 19);
}

export function getItemLabel(item: IArticle): string {
    const headlineTrimmed = item.headline?.trim();
    const sluglineTrimmed = item.slugline?.trim();

    if (headlineTrimmed.length > 0) {
        return headlineTrimmed;
    } else if (sluglineTrimmed.length > 0) {
        return sluglineTrimmed;
    } else {
        return `[${gettext('Untitled')}]`;
    }
}
