import {nameof} from '@sourcefabric/common';
import * as React from 'react';
import {IPage, ISuperdeskQuery, IUser} from 'superdesk-api';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {findEarliestTime, getLowest, getTimeNumber} from './find-earliest-time';

const {gettext} = superdesk.localization;
const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

type IProps = React.ComponentProps<IPage['component']>;

function sortByMultipleCriteria<T>(array: Array<T>, ...compareFns: Array<(a: T, b: T) => number>): Array<T> {
    // type z =
    return [] as Array<T>;
}

const arr = [
    {name: 'a', score: 10},
    {name: 'c', score: 5},
    {name: 'b', score: 1},
];

function numberCompare(a: number, b: number) {
    if (a < b) {
        return -1;
    }

    if (a > b) {
        return 1
    }

    return 0;
}

sortByMultipleCriteria(
    arr,
    (a, b) => a.name.localeCompare(b.name),
    (a, b) => numberCompare(a.score, b.score),
);

export class CorrespondentAvailability extends React.PureComponent<IProps> {
    render() {
        const date = '2025-04-24';

        const query: ISuperdeskQuery = {
            filter: {
                $and: [
                    {[nameof<IAvailabilityRecord>('date')]: {$gte: date}},
                    {[nameof<IAvailabilityRecord>('date')]: {$lte: date}},
                ],
            },
            page: 1,
            max_results: 200,
            sort: [{'versioncreated': 'asc'}], // sorting isn't relevant
        }

        // It is expected to return a negative value if the first argument is less
        // zero if they're equal, and
        // a positive value otherwise.

        return (
            <div>
                <div>
                    {gettext('Correspondent availability')}
                </div>

                <WithAvailabilityRecordsQuery resource="user_availability" query={query}>
                    {(res) => {
                        const users: {[key: string]: IUser} = superdesk.entities.users.getAllUsers();

                        const items = res._items.sort((a, b) => {
                            const timeA = a.status === 'partial'
                                ? getLowest((a.working_hours ?? []).map((a) => getTimeNumber(a.start_time))) ?? 0
                                : 0;

                            const timeB = b.status === 'partial'
                                ? getLowest((b.working_hours ?? []).map((b) => getTimeNumber(b.start_time))) ?? 0
                                : 0;

                            if (timeA < timeB) return -1;
                            if (timeA > timeB) return 1;

                            const nameA: string = users[a.user].display_name ?? users[a.user].username;
                            const nameB: string = users[b.user].display_name ?? users[b.user].username;

                            return nameA.localeCompare(nameB);
                        });
                    }}
                </WithAvailabilityRecordsQuery>
            </div>
        );
    }
}
