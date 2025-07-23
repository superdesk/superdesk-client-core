/**
 * The purpose of this file is to allow the main bundle to access configs synchronously at the top level.
 * NOTE: asynchronous code must not be used here. If network requests are needed - blocking XHR must be used.
 */

import {merge} from 'lodash';
import {IDENTITY_KEY} from 'appConfig';
import {applyConfigurationDefaults} from './apply-configuration-defaults';
import {ISuperdeskGlobalConfig, IUser} from 'superdesk-api';
import {DEFAULT_ENGLISH_TRANSLATIONS} from './core/utils';

function fetchSync(url: string, callback: (responseText: string) => void): void {
    const request = new XMLHttpRequest();

    request.addEventListener('load', function onLoad() {
        if (this.status !== 200) {
            throw new Error(`Failed to GET ${url}`);
        }

        callback(this.responseText);
    });

    request.open(
        'GET',
        url,
        false, // async=false
    );

    request.send();
}

//
// LOADING APP CONFIGURATION
//

fetchSync(
    __SUPERDESK_CONFIG__.server.url + '/client_config',
    (responseText) => {
        const res = JSON.parse(responseText);

        let appConfig: ISuperdeskGlobalConfig = __SUPERDESK_CONFIG__;

        // apply config from server
        merge(appConfig, res.config);

        applyConfigurationDefaults(appConfig);

        // allow e2e tests to overwrite appConfig via local storage
        merge(appConfig, merge(appConfig, JSON.parse(localStorage.getItem('TEST_APP_CONFIG') ?? '{}')));

        window['appConfigLoaded'] = appConfig;
    },
);

const appConfig: ISuperdeskGlobalConfig = window['appConfigLoaded'];

//
// SETTING UI LANGUAGE
//

const user: IUser | null = JSON.parse(localStorage.getItem(IDENTITY_KEY));
const languageFromLocalStorage = user?.language ?? appConfig.default_language ?? window.navigator.language ?? 'en';
const language = appConfig.profileLanguages?.includes(languageFromLocalStorage) ? languageFromLocalStorage : 'en';

window['user-interface-language'] = language;

//
// LOADING TRANSLATIONS
//

const translationsUrl = `/languages/${language}.json?nocache=${Date.now()}`;

function applyTranslations(translations) {
    const langOverride = appConfig.langOverride ?? {};

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.translations = translations;
}


if (language === 'en') {
    applyTranslations(DEFAULT_ENGLISH_TRANSLATIONS);
} else {
    fetchSync(translationsUrl, (responseText) => {
        const translations = JSON.parse(responseText);

        if (
            translations[''] == null
            || translations['']['language'] == null
            || translations['']['plural-forms'] == null
        ) {
            throw new Error(`Language metadata not found in "${translationsUrl}"`);
        }

        applyTranslations(translations);
    });
}
