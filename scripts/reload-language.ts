import {IDENTITY_KEY, appConfig} from 'appConfig';
import {DEFAULT_ENGLISH_TRANSLATIONS} from 'core/utils';
import {ISuperdeskGlobalConfig, IUser} from 'superdesk-api';

const isTestEnvironment = typeof jasmine !== 'undefined';

const normalizeLanguageCode = (language: string) => language.replace(/_/g, '-').toLowerCase();
const getBaseLanguage = (language: string) => normalizeLanguageCode(language).split('-')[0];

/**
 * Profile languages are configured per instance, either with hyphens ("fr-CA")
 * or underscores ("sv_SE"). Matches regardless of separator and case and returns the
 * first match exactly as configured.
 */
function matchProfileLanguage(language: string, profileLanguages: Array<string>): string | null {
    return profileLanguages.find(
        (profileLanguage) => normalizeLanguageCode(profileLanguage) === normalizeLanguageCode(language),
    ) ?? null;
}

/**
 * Browsers report BCP 47 tags (e.g. "sv-SE", "fr-FR", "sv"), and profile languages
 * are not always region specific (e.g. "sv_SE", "fr").
 * Tries an exact match first, then the base language, then a regional variant of the base language
 * if exactly one is configured (e.g. "sv" -> "sv_SE", but no guessing between "zh_CN" and "zh_TW").
 */
function matchBrowserLanguage(browserLanguage: string, profileLanguages: Array<string>): string | null {
    const baseLanguage = getBaseLanguage(browserLanguage);
    const variants = profileLanguages.filter(
        (profileLanguage) => getBaseLanguage(profileLanguage) === baseLanguage,
    );

    return matchProfileLanguage(browserLanguage, profileLanguages)
        ?? matchProfileLanguage(baseLanguage, profileLanguages)
        ?? (variants.length === 1 ? variants[0] : null);
}

/**
 * `config` must be passed explicitly from `init.ts`. The `appConfig` module is evaluated there
 * before `/client_config` is loaded, so it would not include server config like `default_language`.
 * The initial language would then not match the one computed later by `reloadLanguage`,
 * causing an infinite page reload loop.
 */
export function getUserLanguage(config: ISuperdeskGlobalConfig = appConfig): string {
    const user: IUser | null = JSON.parse(localStorage.getItem(IDENTITY_KEY));
    const browserLanguage = window.navigator.language == null
        ? null
        : matchBrowserLanguage(window.navigator.language, config.profileLanguages ?? []);

    const language =
        user?.language
        ?? localStorage.getItem('LOGGED_OUT_LANGUAGE')
        ?? config.default_language
        ?? browserLanguage
        ?? 'en';

    return matchProfileLanguage(language, config.profileLanguages ?? []) ?? 'en';
}

function applyTranslations(translations) {
    const language = getUserLanguage();
    const langOverride = appConfig.langOverride ?? {};

    if (langOverride[language] != null) {
        Object.assign(translations, langOverride[language]);
    }

    window.translations = translations;

    if (!isTestEnvironment) {
        window.location.reload();
    }
}

function loadTranslations(language: string) {
    if (language === 'en') {
        applyTranslations(DEFAULT_ENGLISH_TRANSLATIONS);
    } else {
        const translationsUrl = `/languages/${language}.json?nocache=${Date.now()}`;

        fetch(translationsUrl)
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
}

// Called after user session is loaded, so if user language has changed,
// UI picks up the latest language from user session
export function reloadLanguage() {
    const newLanguage = getUserLanguage();
    const currentLanguage = window['user-interface-language'];

    if (newLanguage === currentLanguage) {
        return;
    }

    window['user-interface-language'] = newLanguage;

    loadTranslations(newLanguage);
}
