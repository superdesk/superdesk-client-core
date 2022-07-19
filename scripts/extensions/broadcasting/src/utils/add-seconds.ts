import * as dateFns from 'date-fns';
import {IISOTime} from 'superdesk-api';

function getTimeStringIso(date: Date): string { // ISO 8601, 13:59:01.123
    return date.toISOString().slice(11, 23);
}

export function addSeconds(time: IISOTime, seconds: number): IISOTime {
    return getTimeStringIso(dateFns.addSeconds(
        new Date(`1970-01-01T${time}Z`),
        seconds,
    ));
}
