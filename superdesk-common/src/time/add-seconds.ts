import * as dateFns from 'date-fns';
import {getTimeStringIso, IISOTime} from './get-time-string-iso';

export function addSeconds(time: IISOTime, seconds: number): IISOTime {
    return getTimeStringIso(dateFns.addSeconds(
        new Date(`1970-01-01T${time}`),
        seconds,
    ));
}
