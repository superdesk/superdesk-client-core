import * as React from 'react';
import {nameof} from '@sourcefabric/common';
import {IPage, ISuperdeskQuery, IUser} from 'superdesk-api';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {sortAvailabilityRecords} from './sort-availability-records';

const {gettext} = superdesk.localization;
const {UserAvatar} = superdesk.components;
const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

type IProps = React.ComponentProps<IPage['component']>;

export class CorrespondentAvailability extends React.PureComponent<IProps> {
    render() {
        const users: {[key: string]: IUser} = superdesk.entities.users.getAllUsers();
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

        return (
            <div>
                <div>
                    {gettext('Correspondent availability')}
                </div>

                <WithAvailabilityRecordsQuery resource="user_availability" query={query}>
                    {(res) => sortAvailabilityRecords(res._items).map((item, i) => {
                        const user = users[item.user];

                        return (
                            <div key={i}>
                                <UserAvatar userId={item.user} />
                                {user.display_name}
                                {user.sign_off}
                            </div>
                        );
                    })}
                </WithAvailabilityRecordsQuery>
            </div>
        );
    }
}
