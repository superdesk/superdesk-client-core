import gettextjs from 'gettext.js';
import {IVocabularyItem, IArticle} from 'superdesk-api';
import {assertNever} from './helpers/typescript-helpers';
import {appConfig, getUserInterfaceLanguage} from 'appConfig';

export const DEFAULT_ENGLISH_TRANSLATIONS = {'': {'language': 'en', 'plural-forms': 'nplurals=2; plural=(n != 1);'}};
const language = getUserInterfaceLanguage();
const filename = `/languages/${language}.json?nocache=${Date.now()}`;

function applyTranslations(translations) {
    const langOverride = appConfig.langOverride ?? {};

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.translations = translations;
}

function requestListener() {
    const translations = JSON.parse(this.responseText);

    if (translations[''] == null || translations['']['language'] == null || translations['']['plural-forms'] == null) {
        throw new Error(`Language metadata not found in "${filename}"`);
    }

    applyTranslations(translations);
}

if (language === 'en') {
    applyTranslations(DEFAULT_ENGLISH_TRANSLATIONS);
} else {
    const req = new XMLHttpRequest();

    req.addEventListener('load', requestListener);
    req.open('GET', filename, false);
    req.send();
}

export const i18n = gettextjs();

if (window.translations != null) {
    const lang = window.translations['']['language'];

    i18n.setMessages(
        'messages',
        lang,
        window.translations,
        window.translations['']['plural-forms'],
    );

    i18n.setLocale(lang);
}

export type IScopeApply = (fn: () => void) => void;

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

export function getVocabularyItemNameTranslated(term: IVocabularyItem, _lang?: string) {
    const _language = _lang ?? getUserInterfaceLanguage();

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
            {sign_off: {$regex: searchString, $options: '-i'}},
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
