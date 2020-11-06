import moment from 'moment';
import {DatePickerLocaleSettings} from 'superdesk-ui-framework/react';
import {appConfig} from 'appConfig';

export function getMonthNamesShort(targetLocale: string): Array<string> {
    const currentLocale = moment.locale();

    moment.locale(targetLocale);

    const monthNames = moment.monthsShort();

    moment.locale(currentLocale); // restore

    return monthNames;
}

export function getMonthNames(targetLocale: string): Array<string> {
    const currentLocale = moment.locale();

    moment.locale(targetLocale);

    const monthNames = moment.months();

    moment.locale(currentLocale); // restore

    return monthNames;
}

export function getLocaleForDatePicker(targetLocale?: string): DatePickerLocaleSettings {
    function getLocale() {
        return {
            firstDayOfWeek: appConfig.startingDay,
            dayNames: moment.weekdays(),
            dayNamesShort: moment.weekdaysShort(),
            dayNamesMin: moment.weekdaysMin(),
            monthNames: moment.months(),
            monthNamesShort: moment.monthsShort(),
        };
    }

    if (targetLocale != null) {
        const currentLocale = moment.locale();

        moment.locale(targetLocale);

        const locale = getLocale();

        moment.locale(currentLocale); // restore

        return locale;
    }

    return getLocale();
}
