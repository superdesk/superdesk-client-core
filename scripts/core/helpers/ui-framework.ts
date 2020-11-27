import moment from 'moment';
import {DatePickerLocaleSettings} from 'superdesk-api';
import {appConfig} from 'appConfig';

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
