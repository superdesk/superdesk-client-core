import gettextjs from 'gettext.js';
import {debugInfo} from 'appConfig';

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
) => {
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
) => {
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
