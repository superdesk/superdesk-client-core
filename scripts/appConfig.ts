import {ISuperdeskGlobalConfig, IExtensions} from 'superdesk-api';

/* globals __SUPERDESK_CONFIG__: true */
export const appConfig: ISuperdeskGlobalConfig = __SUPERDESK_CONFIG__;

if (appConfig.startingDay == null) {
    appConfig.startingDay = '0'; // sunday
}

export const dashboardRoute = '/workspace';

export const extensions: IExtensions = {};
