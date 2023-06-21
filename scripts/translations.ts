import {appConfig, getUserInterfaceLanguage} from 'appConfig';

const language = getUserInterfaceLanguage();
const filename = `/languages/${language}.json?nocache=${Date.now()}`;

function requestListener() {
    const translations = JSON.parse(this.responseText);

    if (translations[''] == null || translations['']['language'] == null || translations['']['plural-forms'] == null) {
        throw new Error(`Language metadata not found in "${filename}"`);
    }

    const langOverride = appConfig.langOverride ?? {};

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.translations = translations;
}

if (language === 'en') {
    window.translations = {'': {'language': 'en', 'plural-forms': 'nplurals=2; plural=(n != 1);'}};
} else {
    const req = new XMLHttpRequest();

    req.addEventListener('load', requestListener);
    req.open('GET', filename, false);
    req.send();
}
