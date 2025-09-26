import {sortByMultipleCriteria} from '@sourcefabric/common';
import {IUser} from 'superdesk-api';
import {configuration} from '../configuration';
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
            return compareUsers(users[a.user], users[b.user]);
        },
    );
}

/**
 * Will be used to determine the order that users are shown in.
 * Returns a number using same rules as callback function that is passed to `Array.sort`
 */
export function compareUsers(a: IUser, b: IUser) {
    if (configuration.compareUsers != null) {
        return configuration.compareUsers(a, b);
    }

    // default implementation below:

    const nameA: string = a.display_name ?? a.username;
    const nameB: string = b.display_name ?? b.username;

    return nameA.localeCompare(nameB);
}
