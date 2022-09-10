import * as dateFns from 'date-fns';
import {getTimeStringIso, ITimeISO} from './get-time-string-iso';

export function addSeconds(time: ITimeISO, seconds: number): ITimeISO {
    return getTimeStringIso(dateFns.addSeconds(
        new Date(`1970-01-01T${time}`),
        seconds,
    ));
}
