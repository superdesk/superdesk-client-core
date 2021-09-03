import moment from 'moment';
import {IDatePickerLocaleSettings} from 'superdesk-api';
import {instanceSettings} from 'instance-settings';
import {getWeekDayIndex} from 'core/utils';

export function getLocaleForDatePicker(targetLocale?: string): IDatePickerLocaleSettings {
    function getLocale() {
        return {
            firstDayOfWeek: getWeekDayIndex(instanceSettings.locale.firstDayOfWeek),
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
