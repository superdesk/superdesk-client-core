import gettextjs from 'gettext.js';
import {debugInfo, getUserInterfaceLanguage} from 'appConfig';
import {IVocabularyItem, IArticle} from 'superdesk-api';
import {assertNever} from './helpers/typescript-helpers';
import {appConfig} from 'appConfig';

export type IScopeApply = (fn: () => void) => void;

export const i18n = gettextjs();

export function stripHtmlTags(value) {
    const el = document.createElement('div');

    el.innerHTML = value;
    return el.innerText;
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
) => {
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

export function getVocabularyItemNameTranslated(term, language = 'en-CA') {
    // Normalize language code format to match the expected keys in term.translations.name
    // Assuming the expected format is 'en-CA', 'fr-CA', etc.
    const normalizedLanguage = language.replace('_', '-');

    // Check if the term has translations and the specified language is available
    if (term.translations && term.translations.name && term.translations.name[normalizedLanguage]) {
        return term.translations.name[normalizedLanguage];
    }

    // Fallback to the 'en-CA' if the specified language translation is not available
    // and if 'en-CA' translation exists.
    if (term.translations && term.translations.name && term.translations.name['en-CA']) {
        return term.translations.name['en-CA'];
    }

    // If no translations are available or the specified language and fallback language are not available,
    // return the default 'name' property.
    return term.name;
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

export function downloadFile(data: string, mimeType: string, fileName: string) {
    const a = document.createElement('a');

    document.body.appendChild(a);
    const blob = new Blob([data], {type: mimeType}),
        url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}
