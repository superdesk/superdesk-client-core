import {sortByMultipleCriteria} from '@sourcefabric/common';
import {IUser} from 'superdesk-api';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {getLowest, getTimeNumber} from '../utils';

export function sortAvailabilityRecords(items: Array<IAvailabilityRecord>): Array<IAvailabilityRecord> {
    const users: {[key: string]: IUser} = superdesk.entities.users.getAllUsers();

    return sortByMultipleCriteria(
        items,
        (a, b) => {
            const timeA = a.status === 'partial'
                ? getLowest((a.working_hours ?? []).map((a) => getTimeNumber(a.start_time))) ?? 0
                : 0;

            const timeB = b.status === 'partial'
                ? getLowest((b.working_hours ?? []).map((b) => getTimeNumber(b.start_time))) ?? 0
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
            const nameA: string = users[a.user].display_name ?? users[a.user].username;
            const nameB: string = users[b.user].display_name ?? users[b.user].username;

            return nameA.localeCompare(nameB);
        },
    );
}
