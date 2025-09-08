import * as React from 'react';
import {Alert} from 'superdesk-ui-framework';
import {groupBy} from 'lodash';
import {IUser} from 'superdesk-api';
import {IAvailabilityRecord, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {getQueryWithFilters} from './get-query-with-filters';
import {fetchParticipants} from './participants';

const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();
const {gettext} = superdesk.localization;

interface IProps {
    dateFrom: Date;
    dateTo: Date;
    filters: Omit<IFilters, 'date'>;
    children: (
        options: {
            byUserByDateAll: ReturnType<typeof getItemsByUserByDate>,
            byUserByDateFiltered: ReturnType<typeof getItemsByUserByDate>,
        },
    ) => React.ReactNode;
    style?: React.CSSProperties;
}

interface IState {
    // participants are users that have availability management enabled
    participantIds: Array<IUser['_id']> | null;
}

export class WithAvailabilityRecords extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            participantIds: null,
        };
    }

    componentDidMount(): void {
        fetchParticipants().then((items) => {
            this.setState({participantIds: Array.from(items)});
        });
    }

    render() {
        const {participantIds} = this.state;

        if (participantIds == null) {
            return null;
        }

        const {filters, dateFrom, dateTo} = this.props;

        return (
            <div style={this.props.style}>
                <WithAvailabilityRecordsQuery
                    resource="user_availability"
                    query={getQueryWithFilters(participantIds, filters, dateFrom, dateTo)}
                >
                    {(itemsFiltered) => (
                        <WithAvailabilityRecordsQuery
                            resource="user_availability"
                            query={getQueryWithFilters(
                                participantIds,
                                {
                                    tags: [],
                                    status: undefined,
                                    language: [],
                                },
                                dateFrom,
                                dateTo,
                            )}
                        >
                            {(itemsAll) => {
                                if (itemsAll.loading || itemsFiltered.loading) {
                                    return null;
                                }

                                const byUserByDateAll = getItemsByUserByDate(itemsAll.data._items);
                                const byUserByDateFiltered = getItemsByUserByDate(itemsFiltered.data._items);

                                // usage of triple-equals required
                                const notSet = filters.status === null;

                                const hasData = (() => {
                                    if (notSet) {
                                        return participantIds.length > 0;
                                    } else {
                                        return Object.keys(byUserByDateFiltered).length > 0;
                                    }
                                })();

                                if (!hasData) {
                                    return (
                                        <div style={{padding: 'var(--space--2)'}}>
                                            <Alert style="hollow" size="small">
                                                <div>{gettext('No data available')}</div>
                                            </Alert>
                                        </div>
                                    );
                                } else {
                                    return this.props.children({byUserByDateAll, byUserByDateFiltered});
                                }
                            }}
                        </WithAvailabilityRecordsQuery>
                    )}
                </WithAvailabilityRecordsQuery>
            </div>
        );
    }
}

export function getItemsByUserByDate(
    items: Array<IAvailabilityRecord>,
): {[userId: string]: {[date: string]: Array<IAvailabilityRecord>}} {
    const byUser = groupBy(items, ({user}) => user);
    const byUserByDate: {[userId: string]: {[date: string]: Array<IAvailabilityRecord>}} = {};

    for (const [userId, items] of Object.entries(byUser)) {
        byUserByDate[userId] = groupBy(items, ({date}) => date);
    }

    return byUserByDate;
}
