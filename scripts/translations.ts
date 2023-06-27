import {appConfig, getUserInterfaceLanguage} from 'appConfig';

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
