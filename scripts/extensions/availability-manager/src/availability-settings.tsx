import * as React from 'react';
import {IBaseRestApiResponse, ISuperdeskQuery, IUser, IUserProfileSection} from 'superdesk-api';
import {superdesk} from './superdesk';
import {Card} from './card';
import {MonthCalendar, Tooltip} from '@sourcefabric/common';

interface IAvailabilityRecord extends IBaseRestApiResponse {
    date: string;
    status: string;
    start_time: string;
    end_time: string;
    tags: Array<{name: string; code: string}>;
}

const {httpRequestJsonLocal} = superdesk;
const {locale} = superdesk.localization;
const firstDayOfWeek = 0;
const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();

type IProps = React.ComponentProps<IUserProfileSection['component']>;

interface IState {
    user: IUser;
}

const query: ISuperdeskQuery = {
    filter: {},
    page: 1,
    max_results: 200,
    sort: [{'versioncreated': 'asc'}], // sorting isn't relevant
};

const defaultDayTemplate: React.ComponentProps<typeof MonthCalendar>['dayTemplate'] = (props) => {
    const {day, dayFromOtherMonth} = props.day;

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
                background: 'orange',
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

export class AvailabilitySettings extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            user: props.user,
        }
    }
    render() {
        return (
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <div style={{margin: '2rem'}}>
                    <Card>
                        <WithAvailabilityRecordsQuery resource='user_availability' query={query}>
                            {({_items}) => (
                                <div>
                                    {_items.map((item) => (
                                        <div key={item._id}>
                                            <Tooltip content="abc">
                                                aaa
                                            </Tooltip>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </WithAvailabilityRecordsQuery>

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: '4rem', placeItems: 'center'}}>
                            {
                                new Array(4).fill(null).map((_, i) => (
                                    <MonthCalendar
                                        key={i}
                                        firstDayOfWeek={firstDayOfWeek}
                                        locale={locale}
                                        dayTemplate={defaultDayTemplate}
                                    />
                                ))
                            }
                        </div>

                        <button onClick={() => {
                            httpRequestJsonLocal({
                                method: 'POST',
                                path: `/user_availability`,
                                payload: {
                                    "date": "2023-05-16",
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
                    </Card>
                </div>
            </div>
        );
    }
}
