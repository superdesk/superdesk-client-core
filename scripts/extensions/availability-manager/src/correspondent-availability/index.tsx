import * as React from 'react';
import {Spacer} from '@sourcefabric/common';
import {IPage} from 'superdesk-api';
import {IAvailabilityRecord, IFilterPeriod, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {ListView} from './list-view';
import {Filters} from './filters';
import {getQueryWithFilters} from './get-query-with-filters';
import {Alert} from 'superdesk-ui-framework/react';

const {gettext} = superdesk.localization;

const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

type IProps = React.ComponentProps<IPage['component']>;

interface IState {
    filters: IFilters;
    filterPeriod: IFilterPeriod;
}

export class CorrespondentAvailability extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            filters: {
                date: new Date(),
                status: [],
                language: [],
                tags: [],
            },
            filterPeriod: 'day',
        };
    }

    render() {
        const paddingInline = 'var(--gap-3)';

        return (
            <Spacer v gap="16" style={{width: '100%'}}>
                <div
                    style={{
                        background: 'var(--sd-item__main-Bg)',
                        borderBlockEnd: '1px solid var(--color-border-line--light)',
                        paddingBlock: 'var(--gap-1)',
                    }}
                >
                    <Filters
                        value={this.state.filters}
                        onChange={(filters) => {
                            this.setState({filters});
                        }}
                        paddingInline={paddingInline}
                        filterPeriod={this.state.filterPeriod}
                        onFilterPeriodChange={(val) => {
                            this.setState({filterPeriod: val});
                        }}
                    />
                </div>


                <div style={{paddingInline}}>
                    <WithAvailabilityRecordsQuery
                        resource="user_availability"
                        query={getQueryWithFilters(this.state.filters)}
                    >
                        {(res) => {
                            if (res._items.length < 1) {
                                return (
                                    <Alert style="hollow" size="small">
                                        <div>{gettext('No data available for the given day')}</div>
                                    </Alert>
                                );
                            } else {
                                return <ListView items={res._items} />;
                            }
                        }}
                    </WithAvailabilityRecordsQuery>
                </div>
            </Spacer>
        );
    }
}
