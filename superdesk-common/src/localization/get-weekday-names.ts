import {arraySpinBackwards} from '../utils/array-spin';

/**
 * Monday = 0, Tuesday = 1
 */
export function getWeekdayNames(
    length: 'short' | 'long',
    firstDayOfWeek: number,
): Array<{index: number, label: string}> {
    const all = [
        {index: 0, label: new Intl.DateTimeFormat('en-us', {weekday: length}).format(new Date('1970-01-05'))}, // Mon
        {index: 1, label: new Intl.DateTimeFormat('en-us', {weekday: length}).format(new Date('1970-01-06'))}, // Tue
        {index: 2, label: new Intl.DateTimeFormat('en-us', {weekday: length}).format(new Date('1970-01-07'))}, // Wed
        {index: 3, label: new Intl.DateTimeFormat('en-us', {weekday: length}).format(new Date('1970-01-08'))}, // Thu
        {index: 4, label: new Intl.DateTimeFormat('en-us', {weekday: length}).format(new Date('1970-01-09'))}, // Fri
        {index: 5, label: new Intl.DateTimeFormat('en-us', {weekday: length}).format(new Date('1970-01-10'))}, // Sat
        {index: 6, label: new Intl.DateTimeFormat('en-us', {weekday: length}).format(new Date('1970-01-11'))}, // Sun
    ];

    return arraySpinBackwards(all, all.length - firstDayOfWeek);
}
