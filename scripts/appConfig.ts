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

export const dashboardRoute = '/workspace';
export const IDENTITY_KEY = 'sess:user';

export function getUserInterfaceLanguage() {
    const user: IUser | null = JSON.parse(localStorage.getItem(IDENTITY_KEY));
    const language = user?.language ?? appConfig.default_language ?? window.navigator.language ?? 'en';

    if (appConfig.profileLanguages.includes(language)) {
        return language;
    } else {
        return 'en';
    }
}

export const debugInfo = {
    translationsLoaded: false,
};

export const extensions: IExtensions = {};
