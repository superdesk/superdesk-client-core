import {merge} from 'lodash';
import {ISuperdeskGlobalConfig, IExtensions, IUser} from 'superdesk-api';

/* globals __SUPERDESK_CONFIG__: true */
export const appConfig: ISuperdeskGlobalConfig = __SUPERDESK_CONFIG__;

if (appConfig.startingDay == null) {
    appConfig.startingDay = '0'; // sunday
}

if (appConfig.shortTimeFormat == null) {
    appConfig.shortTimeFormat = 'HH:mm'; // 24h format
}

if (appConfig.ui == null) {
    appConfig.ui = {};

    if (appConfig.ui.italicAbstract == null) {
        appConfig.ui.italicAbstract = true;
    }
}

if (appConfig.features == null) {
    appConfig.features = {};
}

if (appConfig.features.autorefreshContent == null) {
    appConfig.features.autorefreshContent = true; // default to true
}

// allow e2e tests to overwrite appConfig via local storage
Object.assign(appConfig, merge(appConfig, JSON.parse(localStorage.getItem('TEST_APP_CONFIG') ?? '{}')));

export const dashboardRoute = '/workspace';
export const IDENTITY_KEY = 'sess:user';
export const extensions: IExtensions = {};

export function getUserInterfaceLanguage() {
    const user: IUser | null = JSON.parse(localStorage.getItem(IDENTITY_KEY));
    const language = user?.language ?? appConfig.default_language ?? window.navigator.language ?? 'en';

    if (appConfig.profileLanguages?.includes(language)) {
        return language;
    } else {
        return 'en';
    }
}

export const debugInfo = {
    translationsLoaded: false,
};

export let authoringReactEnabledUserSelection = true;

export function toggleAuthoringReact(enabled: boolean) {
    localStorage.setItem('auth-react', JSON.stringify(enabled));

    authoringReactEnabledUserSelection = enabled;
    return authoringReactEnabledUserSelection;
}
/**
 * Authoring react has to be enabled in the broadcasting
 * module regardless of the user selection.
 * */
export let authoringReactViewEnabled = authoringReactEnabledUserSelection;
export const uiFrameworkAuthoringPanelTest = false;

export function setAuthoringReact(enabled: boolean) {
    authoringReactViewEnabled = enabled;
}
