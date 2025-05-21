import * as React from 'react';
import {Spacer} from '@sourcefabric/common';
import {IPage} from 'superdesk-api';
import {IFilterPeriod, IFilters, IWeekday} from '../interfaces';
import {superdesk} from '../superdesk';
import {DayView} from './day-view';
import {Filters} from './filters';
import {WeekView} from './week-view';
import {startOfWeek} from 'date-fns';

const {assertNever} = superdesk.helpers;
const {locale} = superdesk.localization;

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
                status: undefined,
                language: [],
                tags: [],
            },
            filterPeriod: 'day',
        };
    }

    render() {
        const dataTestId: string = (() => {
            if (this.state.filterPeriod === 'day') {
                return 'day-view';
            } else if (this.state.filterPeriod === 'week') {
                return 'week-view';
            } else {
                return assertNever(this.state.filterPeriod);
            }
        })();

        return (
            <Spacer v gap="16" style={{width: '100%', height: '100%', overflow: 'auto'}} data-test-id={dataTestId}>
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
                        paddingInline={'var(--gap-3)'}
                        filterPeriod={this.state.filterPeriod}
                        onFilterPeriodChange={(val) => {
                            switch (val) {
                                case 'week':
                                    this.setState({
                                        filterPeriod: val,
                                        filters: {
                                            ...this.state.filters,
                                            date: startOfWeek(
                                                this.state.filters.date,
                                                {
                                                    weekStartsOn: locale.firstDayOfWeek as IWeekday,
                                                },
                                            ),
                                        },
                                    });
                                    break;
                                case 'day':
                                    this.setState({filterPeriod: val});
                                    break;
                                default:
                                    assertNever(val);
                            }
                        }}
                    />
                </div>

                {(() => {
                    if (this.state.filterPeriod === 'day') {
                        return <DayView filters={this.state.filters} />;
                    } else if (this.state.filterPeriod === 'week') {
                        return <WeekView filters={this.state.filters} />;
                    } else {
                        return assertNever(this.state.filterPeriod);
                    }
                })()}
            </Spacer>
        );
    }
}
