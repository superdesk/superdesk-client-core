import * as React from 'react';
import {nameof} from '@sourcefabric/common';
import {IPage, ISuperdeskQuery} from 'superdesk-api';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {ListView} from './list-view';

const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

type IProps = React.ComponentProps<IPage['component']>;

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

        return (
            <WithAvailabilityRecordsQuery resource="user_availability" query={query}>
                {(res) => (
                    <ListView items={res._items} />
                )}
            </WithAvailabilityRecordsQuery>
        );
    }
}
