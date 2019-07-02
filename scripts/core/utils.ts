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

    /**
 * @ngdoc method
 * @name gettext
 * @param {String} text - the text that will be translated, it supports parameters (see the example)
 * @param {Object} params - dictionary of parameters used in text and their value (see the example)
 * @description Used angular gettext service for displaying localised text on Browser
 *
 * gettext('This item was locked by {{username}}.', {username: 'John'});
 * result -> 'This item was locked by John'
 */
export const gettext = (text, params = null) => {
    if (!text) {
        return '';
    }

    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        return injector.get('gettextCatalog').getString(text, params || {});
    }

    return text;
};

/**
 * @ngdoc method
 * @name gettextPlural
 * @param {Number} count
 * @param {String} text
 * @param {String} pluralText
 * @param {Object} params
 * @description Used angular gettext service for displaying plural localised text on Browser
 */
export const gettextPlural = (count, text, pluralText, params = {}) => {
    if (!text) {
        return '';
    }

    const injector = angular.element(document.body).injector();

    if (injector) { // in tests this will be empty
        return injector.get('gettextCatalog').getPlural(count, text, pluralText, params);
    }

    return text;
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
