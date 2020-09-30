import moment from 'moment';

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
