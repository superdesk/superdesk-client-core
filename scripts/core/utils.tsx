import React from 'react';
import gettextjs from 'gettext.js';
import {appConfig, getUserInterfaceLanguage} from 'appConfig';
import {IVocabularyItem, IArticle, IBaseRestApiResponse, ILockInfo} from 'superdesk-api';
import {assertNever} from './helpers/typescript-helpers';
import {isObject, omit} from 'lodash';

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

/**
 * Get superdesk supported type for data transfer if any
 *
 * @param {Event} event
 * @param {Boolean} supportExternalFiles
 * @return {string}
 */
export const getSuperdeskType = (event, supportExternalFiles = true) => {
    const evt = event.originalEvent ?? event;

    return evt.dataTransfer.types.find((name) =>
        name.includes('application/superdesk') || supportExternalFiles && name === 'Files',
    );
};

export function getDroppedItem(event): IArticle | null {
    const superdeskType = getSuperdeskType(event);

    if (superdeskType == null || superdeskType === 'Files') {
        return null;
    }

    const __item: IArticle = JSON.parse(event.dataTransfer.getData(superdeskType));

    return __item;
}

/**
 * Works the same way as `gettext`, except that it's possible to also use React components
 * as placeholders, not only strings.
 */
const gettextReact = (
    text: string,
    params: {[placeholder: string]: string | number | React.ComponentType},
): Array<JSX.Element> => {
    let matches: Array<{index: number, str: string, placeholder: string}> = [];

    for (const placeholder of Object.keys(params)) {
        /**
         * Multiple instances of a placeholder might be present.
         * Different placeholders may be mixed in between of each other.
         * The loop below will find all instances and push to `matches`.
         */
        let lastIndex = 0;

        let match = text.slice(lastIndex, text.length).match(new RegExp(`{{\\s*${placeholder}\\s*}}`));

        while (match != null) {
            matches.push({index: lastIndex + match.index, str: match['0'], placeholder: placeholder});

            lastIndex += match.index + match['0'].length;
            match = text.slice(lastIndex, text.length).match(new RegExp(`{{\\s*${placeholder}\\s*}}`));
        }
    }

    matches = matches.sort((a, b) => a.index - b.index);

    const result: Array<JSX.Element> = [];

    let fromIndex = 0;

    for (const match of matches) {
        const plainText = text.slice(fromIndex, match.index);

        result.push(<span key={fromIndex + '-str'}>{plainText}</span>);

        const Replacement = params[match.placeholder];

        if (typeof Replacement === 'function') {
            result.push(<Replacement key={fromIndex} />);
        } else {
            result.push(<span key={fromIndex}>{Replacement}</span>);
        }

        fromIndex = match.index + match.str.length;
    }

    const endText = text.slice(fromIndex, text.length);

    result.push(<span key={fromIndex}>{endText}</span>);

    return result;
};

// example: gettext('Item was locked by {{user}}.', {user: 'John Doe'});
export const gettext = (
    text: string,
    params: {[placeholder: string]: string | number | React.ComponentType} = {},
) => {
    if (!text) {
        return '';
    }

    let translated = i18n.gettext(text);

    const hasReactPlaceholders = Object.values(params).some((val) => typeof val === 'function');

    if (hasReactPlaceholders) {
        return gettextReact(translated, params);
    } else {
        Object.keys(params ?? {}).forEach((param) => {
            translated = translated.replace(new RegExp(`{{\\s*${param}\\s*}}`, 'g'), params[param]);
        });

        return translated;
    }
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
    params: {[key: string]: string | number | React.ComponentType} = {},
): string => {
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

    if (headlineTrimmed?.length > 0) {
        return headlineTrimmed;
    } else if (sluglineTrimmed?.length > 0) {
        return sluglineTrimmed;
    } else {
        return `[${gettext('Untitled')}]`;
    }
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

export function stripBaseRestApiFields<T extends {}>(entity: T): T {
    type IKeys = { [P in keyof Required<IBaseRestApiResponse>]: 1 };

    const keysObject: IKeys = {
        _updated: 1,
        _created: 1,
        _id: 1,
        _etag: 1,
        _links: 1,
        _status: 1,
        _current_version: 1,
        _latest_version: 1,
    };

    const keysArray = Object.keys(keysObject);

    return omit(entity, keysArray) as T;
}

export function stripLockingFields<T extends {}>(entity: T): T {
    type IKeys = { [P in keyof Required<ILockInfo>]: 1 };

    const keysObject: IKeys = {
        _lock: 1,
        _lock_action: 1,
        _lock_session: 1,
        _lock_expiry: 1,
        _lock_time: 1,
        _lock_user: 1,
    };

    const keysArray = Object.keys(keysObject);

    return omit(entity, keysArray) as T;
}
