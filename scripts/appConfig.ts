import {ISuperdeskGlobalConfig, IExtensions} from 'superdesk-api';

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

export const dashboardRoute = '/workspace';
export const IDENTITY_KEY = 'sess:user';

export const extensions: IExtensions = {};
