/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

let lang = appConfig.langOverride;

if (Object.keys(lang).length > 0) {
    angular.module('gettext').run(['gettextCatalog', (catalog) => {
        for (let k of Object.keys(lang)) {
            catalog.setStrings(k, lang[k]);
        }
    }]);
}

/**
 * Noop for registering string for translation in js files.
 *
 * This is supposed to be used in angular config phase,
 * where we can't use the translate service.
 *
 * And while this doesn't do much, you still have to call translate in template.
 *
 * @param {string} input
 * @return {string} unmodified input
 */
window.gettext = function(input) {
    return input;
};

import map from './language-mapping-list';
export default map;
