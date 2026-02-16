/**
 * The purpose of this file is to allow the main bundle to access configs synchronously at the top level.
 * NOTE: asynchronous code must not be used here. If network requests are needed - blocking XHR must be used.
 */

import {merge} from 'lodash';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {DEFAULT_ENGLISH_TRANSLATIONS} from './core/utils';
import {getUserLanguage} from 'reload-language';

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

        // Normalize and sync week start with startingDay taking precedence.
        const normalizeWeekStart = (value: any): number | null => {
            if (value == null) {
                return null;
            }

            const normalized = typeof value === 'string' ? parseInt(value, 10) : value;

            return Number.isNaN(normalized) ? null : normalized;
        };

        const normalizedStartingDay = normalizeWeekStart(_appConfig.startingDay);
        const normalizedStartOfWeek = normalizeWeekStart(_appConfig.start_of_week);

        if (normalizedStartingDay != null) {
            _appConfig.startingDay = normalizedStartingDay;
            _appConfig.start_of_week = normalizedStartingDay;
        } else if (normalizedStartOfWeek != null) {
            _appConfig.start_of_week = normalizedStartOfWeek;
            _appConfig.startingDay = normalizedStartOfWeek;
        } else {
            _appConfig.startingDay = 0;
            _appConfig.start_of_week = 0;
        }

        // allow e2e tests to overwrite appConfig via local storage
        merge(_appConfig, merge(_appConfig, JSON.parse(localStorage.getItem('TEST_APP_CONFIG') ?? '{}')));

        window['appConfigLoaded'] = _appConfig;
    },
);

const appConfig: ISuperdeskGlobalConfig = window['appConfigLoaded'];

//
// SETTING UI LANGUAGE
//
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

if (language === 'en') {
    applyTranslations(DEFAULT_ENGLISH_TRANSLATIONS);
} else {
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
