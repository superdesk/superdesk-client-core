import * as dateFns from 'date-fns';
import {IISOTime} from 'superdesk-api';
import {superdesk} from '../superdesk';
const {getTimeStringIso} = superdesk.helpers;

export function addSeconds(time: IISOTime, seconds: number): IISOTime {
    return getTimeStringIso(dateFns.addSeconds(
        new Date(`1970-01-01T${time}Z`),
        seconds,
    ));
}
