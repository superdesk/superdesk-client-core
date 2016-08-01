/* globals __SUPERDESK_CONFIG__: true */
const appConfig = __SUPERDESK_CONFIG__;

// this file is generated using `grunt nggettext_compile`
import './lang.generated';

let lang = appConfig.langOverride;

if (Object.keys(lang).length > 0) {
    angular.module('gettext').run(['gettextCatalog', catalog => {
        for (let k of Object.keys(lang)) {
            catalog.setStrings(k, lang[k]);
        }
    }]);
}

import map from './language-mapping-list';

export default map;
