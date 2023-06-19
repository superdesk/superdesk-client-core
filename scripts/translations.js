// We have the same function in `scripts/appConfig.ts`
// defined because there we can't export this one
// FIXME: When changing one or the other
// update both functions so they are the same
function getUserInterfaceLanguage() {
    const user = JSON.parse(localStorage.getItem('sess:user'));
    const language = user?.language ?? __SUPERDESK_CONFIG__.default_language ?? window.navigator.language ?? 'en';

    if (__SUPERDESK_CONFIG__.profileLanguages?.includes(language)) {
        return language;
    } else {
        return 'en';
    }
}

function requestListener() {
    const translations = JSON.parse(this.responseText);

    if (translations[''] == null || translations['']['language'] == null || translations['']['plural-forms'] == null) {
        throw new Error(`Language metadata not found in "${filename}"`);
    }

    const langOverride = __SUPERDESK_CONFIG__.langOverride ?? {};
    const pluralForms = translations['']['plural-forms'];

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.language = language;
    window.translations = translations;
    window.pluralForms = pluralForms;
}

const language = getUserInterfaceLanguage();

if (language === 'en') {
    window.language = 'en';
    window.translations = '';
    window.pluralForms = 'nplurals=2; plural=(n != 1);';
} else {
    const filename = `/languages/${language}.json?nocache=${Date.now()}`;

    const req = new XMLHttpRequest();

    req.addEventListener('load', requestListener);

    req.open('GET', filename, false);
    req.send();
}
