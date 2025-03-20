import * as React from 'react';
import {addMonths, format} from 'date-fns';
import {groupBy, pick, range} from 'lodash';
import {MonthCalendar, nameof, Spacer, SpacerBlock} from '@sourcefabric/common';
import {Button, IconButton} from 'superdesk-ui-framework';
import {IBaseRestApiResponse, ISuperdeskQuery, IUser, IUserProfileSection} from 'superdesk-api';
import {superdesk} from './superdesk';
import {Card} from './card';

interface IAvailabilityRecord extends IBaseRestApiResponse {
    date: string;
    status: 'available' | 'unavailable' | 'partial';
    start_time: string;
    end_time: string;
    tags: Array<{name: string; code: string}>;
}

const {httpRequestJsonLocal} = superdesk;
const {locale, gettext} = superdesk.localization;
const {firstDayOfWeek} = superdesk.localization.locale;
const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

const verticalSpacing = '1.4rem';

const Page: React.ComponentType<{children: React.ReactNode}> = (props) => (
    <div style={{display: 'flex', justifyContent: 'center'}}>
        <div style={{margin: '2rem'}}>
            <Card paddingBlockStart={0}>
                {props.children}
            </Card>
        </div>
    </div>
);

type IProps = React.ComponentProps<IUserProfileSection['component']>;

interface IState {
    user: IUser;
    calendarStart: Date;
}

export class AvailabilitySettings extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            user: props.user,
            calendarStart: new Date(),
        }
    }

    render() {
        const monthsToDisplayAtOnce = 4;
        const months: Array<Date> = range(0, monthsToDisplayAtOnce).map((toAdd) => addMonths(this.state.calendarStart, toAdd));

        const query: ISuperdeskQuery = {
            filter: {
                [nameof<IAvailabilityRecord>('date')]: {$gte: format(months[0], 'yyyy-MM-dd')},
                [nameof<IAvailabilityRecord>('date')]: {$lte: format(months[months.length - 1], 'yyyy-MM-dd')},
            },
            page: 1,
            max_results: 200,
            sort: [{'versioncreated': 'asc'}], // sorting isn't relevant
        };

        return (
            <Page>
                <WithAvailabilityRecordsQuery resource='user_availability' query={query}>
                    {(res) => {
                        const grouped = groupBy(res._items, (item) => item.date);

                        const defaultDayTemplate: React.ComponentProps<typeof MonthCalendar>['dayTemplate'] = (props) => {
                            const {day, dayFromOtherMonth} = props.day;

                            const dateKey = format(props.day.date, 'yyyy-MM-dd');
                            const entriesForDay = grouped[dateKey] ?? [];

                            return (
                                <div
                                    key={day}
                                    style={{
                                        opacity: dayFromOtherMonth ? 0.5 : undefined,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        background: !dayFromOtherMonth && entriesForDay.length > 0 ? 'orange' : undefined,
                                        borderRadius: 20,
                                    }}
                                    onClick={() => {
                                        window.alert('clicked on day ' + day);
                                    }}
                                >
                                    {day}
                                </div>
                            );
                        };

                        return (
                            <div>
                                <Spacer h gap="16" noWrap justifyContent="space-between" style={{paddingBlock: verticalSpacing}}>
                                    <Spacer h gap="0" noGrow>
                                        <IconButton
                                            icon="chevron-left-thin"
                                            ariaValue={gettext('Previous')}
                                            onClick={() => {
                                                this.setState({
                                                    calendarStart: addMonths(this.state.calendarStart, -monthsToDisplayAtOnce),
                                                })
                                            }}
                                        />
                                        <IconButton
                                            icon="chevron-right-thin"
                                            ariaValue={gettext('Next')}
                                            onClick={() => {
                                                this.setState({
                                                    calendarStart: addMonths(this.state.calendarStart, monthsToDisplayAtOnce),
                                                })
                                            }}
                                        />

                                        <SpacerBlock h gap="8" />

                                        <h3>{gettext('Availability schedule')}</h3>
                                    </Spacer>

                                    <Button
                                        text={gettext('Manage')}
                                        style="hollow"
                                        onClick={() => {
                                            // PR-TODO: implement
                                            return null;
                                        }}
                                    />
                                </Spacer>

                                <hr style={{borderColor: 'graylight', marginBlock: 0, marginBlockEnd: verticalSpacing}} />

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gridRowGap: '1.4rem', columnGap: '2.8rem', placeItems: 'start'}}>
                                    {
                                        months.map((month, i) => (
                                            <MonthCalendar
                                                key={i}
                                                month={month}
                                                firstDayOfWeek={firstDayOfWeek}
                                                locale={locale.code}
                                                dayTemplate={defaultDayTemplate}
                                            />
                                        ))
                                    }
                                </div>

                                {/* PR-TODO: remove demo code */}
                                {res._items.map((item) => (
                                    <div key={item._id}>
                                        <pre>
                                            {JSON.stringify(pick(item, 'date', 'status', 'start_time', 'end_time'), null, 4)}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )
                    }}
                </WithAvailabilityRecordsQuery>





                {/* PR-TODO: remove demo code below */}




                <br />
                <br />
                <br />
                <br />
                <br />

                <button onClick={() => {
                    httpRequestJsonLocal({
                        method: 'POST',
                        path: `/user_availability`,
                        payload: {
                            "date": "2025-10-01",
                            "status": "available",
                            "start_time": "09:00:00",
                            "end_time": "17:00:00",
                            "tags": [
                                {"name": "Regular Shift", "code": "regular"}
                            ]
                        }
                    });
                }}>
                    post
                </button>
            </Page>
        );
    }
}
