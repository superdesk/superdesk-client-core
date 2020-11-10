import gettextjs from 'gettext.js';
import {debugInfo} from 'appConfig';
import {IVocabularyItem} from 'superdesk-api';

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
        console.error(`Invalid translation attempt for string "${text}": translation strings haven't been loaded yet.`);
    }

    let translated = i18n.gettext(text);

    Object.keys(params).forEach((param) => {
        translated = translated.replace(new RegExp(`{{\\s*${param}\\s*}}`), params[param]);
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
        console.error(`Invalid translation attempt for string "${text}": translation strings haven't been loaded yet.`);
    }

    let translated = i18n.ngettext(text, pluralText, count);

    Object.keys(params).forEach((param) => {
        translated = translated.replace(new RegExp(`{{\\s*${param}\\s*}}`), params[param]);
    });

    return translated;
};

export const gettextCatalog = {
    getPlural: gettextPlural,
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

export function getVocabularyItemNameTranslated(item: IVocabularyItem, language: string) {
    if (language == null) {
        return item.name;
    }

    return item?.translations?.name?.[language] ?? item.name;
}
