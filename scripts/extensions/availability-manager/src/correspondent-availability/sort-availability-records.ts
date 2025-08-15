import {sortByMultipleCriteria} from '@sourcefabric/common';
import {IUser} from 'superdesk-api';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {getTimeNumber} from '../utils';

export function sortAvailabilityRecords(items: Array<IAvailabilityRecord>): Array<IAvailabilityRecord> {
    const users: {[key: string]: IUser} = superdesk.entities.users.getAllUsers();

    return sortByMultipleCriteria(
        items,
        (a, b) => {
            const timeA = a.status === 'partial'
                ? Math.min(0, ...((a.working_hours ?? []).map((a) => getTimeNumber(a.start_time))))
                : 0;

            const timeB = b.status === 'partial'
                ? Math.min(0, ...((b.working_hours ?? []).map((b) => getTimeNumber(b.start_time))))
                : 0;

            if (timeA < timeB) {
                return -1;
            } else if (timeA > timeB) {
                return 1;
            } else {
                return 0;
            }
        },
        (a, b) => {
            return compareUsersByName(users[a.user], users[b.user]);
        },
    );
}

export function compareUsersByName(a: IUser, b: IUser) {
    const nameA: string = a.username ?? a.display_name;
    const nameB: string = b.username ?? b.display_name;

    return nameA.localeCompare(nameB);
}
