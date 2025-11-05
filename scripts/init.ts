/**
 * The purpose of this file is to allow the main bundle to access configs synchronously at the top level.
 * NOTE: asynchronous code must not be used here. If network requests are needed - blocking XHR must be used.
 */

import {merge} from 'lodash';
import {IDENTITY_KEY} from 'appConfig';
import {ISuperdeskGlobalConfig, IUser} from 'superdesk-api';
import {DEFAULT_ENGLISH_TRANSLATIONS} from './core/utils';

export function fetchSync(url: string, callback: (responseText: string) => void): void {
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

const _appConfig: ISuperdeskGlobalConfig = __SUPERDESK_CONFIG__;

// update config via config.js (production config)
if (window.superdeskConfig) {
    merge(_appConfig, window.superdeskConfig);
}

//
// LOADING APP CONFIGURATION
//

fetchSync(
    _appConfig.server.url + '/client_config',
    (responseText) => {
        const res = JSON.parse(responseText);

        // apply config from server
        merge(_appConfig, res.config);

        // allow e2e tests to overwrite appConfig via local storage
        merge(_appConfig, merge(_appConfig, JSON.parse(localStorage.getItem('TEST_APP_CONFIG') ?? '{}')));

        window['appConfigLoaded'] = _appConfig;
    },
);

const appConfig: ISuperdeskGlobalConfig = window['appConfigLoaded'];

//
// SETTING UI LANGUAGE
//

export function getUserLanguage(): string {
    const user: IUser | null = JSON.parse(localStorage.getItem(IDENTITY_KEY));

    const language =
        user?.language
        ?? localStorage.getItem('LOGGED_OUT_LANGUAGE')
        ?? appConfig.default_language
        ?? window.navigator.language
        ?? 'en';

    return appConfig.profileLanguages?.includes(language) ? language : 'en';
}

const language = getUserLanguage();

window['user-interface-language'] = language;

//
// LOADING TRANSLATIONS
//


function applyTranslations(translations) {
    const langOverride = appConfig.langOverride ?? {};

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.translations = translations;
}

export function loadTranslations(language: string) {
    if (language === 'en') {
        applyTranslations(DEFAULT_ENGLISH_TRANSLATIONS);
    }

    const translationsUrl = `/languages/${language}.json?nocache=${Date.now()}`;

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

// Call this on module load, for login screen language setting
loadTranslations(language);

// Called after user session is loaded, so if user language has changed,
// UI picks up the latest language from user session
export function reloadLanguage(): Promise<void> {
    const newLanguage = getUserLanguage();
    const currentLanguage = window['user-interface-language'];

    if (newLanguage === currentLanguage) {
        return Promise.resolve();
    }

    window['user-interface-language'] = newLanguage;

    loadTranslations(newLanguage);
}
