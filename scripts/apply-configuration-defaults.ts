import {ISuperdeskGlobalConfig} from 'superdesk-api';

/**
 * note: mutates argument
 */
export function applyConfigurationDefaults(appConfig: ISuperdeskGlobalConfig) {
    if (appConfig.startingDay == null) {
        appConfig.startingDay = '0'; // sunday
    }

    if (appConfig.shortTimeFormat == null) {
        appConfig.shortTimeFormat = 'HH:mm'; // 24h format
    }

    if (appConfig.ui == null) {
        appConfig.ui = {};
    }

    if (appConfig.ui.sendEmbargo == null) {
        appConfig.ui.sendEmbargo = false;
    }

    if (appConfig.ui.italicAbstract == null) {
        appConfig.ui.italicAbstract = true;
    }

    if (appConfig.ui.publishEmbargo == null) {
        appConfig.ui.publishEmbargo = true;
    }

    if (appConfig.authoring == null) {
        appConfig.authoring = {};
    }

    if (appConfig.authoring.panels == null) {
        appConfig.authoring.panels = {};
    }

    if (appConfig.authoring.panels.publish == null) {
        appConfig.authoring.panels.publish = {};
    }

    if (appConfig.authoring.panels.publish.publishSchedule == null) {
        appConfig.authoring.panels.publish.publishSchedule = true;
    }

    if (appConfig.authoring.panels.publish.publishingTarget == null) {
        appConfig.authoring.panels.publish.publishingTarget = true;
    }

    if (appConfig.authoring.panels.sendTo == null) {
        appConfig.authoring.panels.sendTo = {};
    }

    if (appConfig.authoring.panels.sendTo.publishSchedule == null) {
        appConfig.authoring.panels.sendTo.publishSchedule = false;
    }

    const defaultDateFormat = 'MM/DD';
    const defaultTimeFormat = 'hh:mm';

    if (appConfig.view == null) {
        appConfig.view = {
            dateformat: defaultDateFormat,
            timeformat: defaultTimeFormat,
        };
    }

    if (appConfig.view.dateformat == null) {
        appConfig.view.dateformat = defaultDateFormat;
    }

    if (appConfig.view.timeformat == null) {
        appConfig.view.timeformat = defaultTimeFormat;
    }

    if (appConfig.longDateFormat == null) {
        appConfig.longDateFormat = 'LLL';
    }

    if (appConfig.features == null) {
        appConfig.features = {};
    }

    if (appConfig.features.autorefreshContent == null) {
        appConfig.features.autorefreshContent = true; // default to true
    }
}
