import moment from 'moment';
import {appConfig} from 'appConfig';
import {IDatePickerISOLocaleSettings} from 'superdesk-api';

export function getLocaleForDatePicker(targetLocale?: string): IDatePickerISOLocaleSettings {
    function getLocale(): IDatePickerISOLocaleSettings {
        return {
            type: 'full',
            payload: {
                firstDayOfWeek: appConfig.startingDay,
                dayNames: moment.weekdays(),
                dayNamesShort: moment.weekdaysShort(),
                dayNamesMin: moment.weekdaysMin(),
                monthNames: moment.months(),
                monthNamesShort: moment.monthsShort(),
            },
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
