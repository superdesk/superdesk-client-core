import {padStart} from 'lodash';

export type IISOTime = string; // ISO 8601, 13:59:01.123

export function getTimeStringIso(date: Date): IISOTime {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();

    let result = '';

    result += padStart(hours.toString(), 2, '0');
    result += ':' + padStart(minutes.toString(), 2, '0');

    if (seconds > 0) {
        result += ':' + padStart(seconds.toString(), 2, '0');
    }

    if (milliseconds > 0) {
        result += '.' + padStart(milliseconds.toString(), 3, '0');
    }

    return result;
}
