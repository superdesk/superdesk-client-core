import {IDENTITY_KEY, appConfig} from 'appConfig';
import {DEFAULT_ENGLISH_TRANSLATIONS} from 'core/utils';
import {IUser} from 'superdesk-api';

function getUserLanguage(): string {
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

function applyTranslations(translations) {
    const langOverride = appConfig.langOverride ?? {};

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.translations = translations;
}

function loadTranslations(language: string) {
    if (language === 'en') {
        applyTranslations(DEFAULT_ENGLISH_TRANSLATIONS);
        return Promise.resolve();
    }

    const translationsUrl = `/languages/${language}.json?nocache=${Date.now()}`;

    return fetch(translationsUrl)
        .then((res) => res.json())
        .then((translations) => {
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


// Called after user session is loaded, so if user language has changed,
// UI picks up the latest language from user session
export function reloadLanguage(): Promise<void> {
    const newLanguage = getUserLanguage();
    const currentLanguage = window['user-interface-language'];

    if (newLanguage === currentLanguage) {
        return Promise.resolve();
    }

    window['user-interface-language'] = newLanguage;

    return loadTranslations(newLanguage);
}
