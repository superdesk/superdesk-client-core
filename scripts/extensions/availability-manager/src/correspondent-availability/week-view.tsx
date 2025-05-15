import * as React from 'react';
import {Spacer, SpacerBlock} from '@sourcefabric/common';
import {addDays} from 'date-fns';
import {groupBy, range} from 'lodash';
import {CalendarWeekDayItem, Text, WeeklyCalendarGrid, WeeklyCalendarGridItem} from 'superdesk-ui-framework/react';
import {TagsPreview} from '../components/tags-preview';
import {IAvailabilityRecord, IDefaultAvailability, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {formatDateIso, getLabelForStatus} from '../utils';
import {getQueryWithFilters} from './get-query-with-filters';
import {WeekViewHeaderDay} from './week-view-header-day';
import {IRestApiResponse, ISuperdeskQuery, IUser} from 'superdesk-api';

const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();
const {UserAvatar} = superdesk.components;
const {httpRequestJsonLocal} = superdesk;
const {prepareSuperdeskQuery} = superdesk.helpers;
const {assertNever, nameof} = superdesk.helpers;

interface IProps {
    filters: IFilters;
}

interface IState {
    // participants are users that have availability management enabled
    participantIds: Set<IUser['_id']> | null;
}

export class WeekView extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            participantIds: null,
        }
    }

    componentDidMount(): void {
        const query: ISuperdeskQuery = {
            filter: {
                $and: [
                    {[nameof<IDefaultAvailability>('enabled')]: {$eq: true}},
                ],
            },
            page: 1,
            max_results: 200,
            sort: [{'versioncreated': 'asc'}],
        };

        httpRequestJsonLocal<IRestApiResponse<IDefaultAvailability>>({
            ...prepareSuperdeskQuery('/default_user_availability', query),
            abortSignal: new AbortController().signal,
        }).then((res) => {
            this.setState({participantIds: new Set(res._items.map(({_id}) => _id))});
        });
    }

    render() {
        const {participantIds} = this.state;

        if (participantIds == null) {
            return null;
        }

        const {filters} = this.props;
        const days = range(0, 7).map((daysToAdd) => addDays(filters.date, daysToAdd));

        const dateFrom = filters.date;
        const dateTo = days[days.length - 1];

        return (
            <WithAvailabilityRecordsQuery
                resource="user_availability"
                query={getQueryWithFilters(filters, dateFrom, dateTo)}
            >
                {(itemsFiltered) => (
                    <WithAvailabilityRecordsQuery
                        resource="user_availability"
                        query={getQueryWithFilters(
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
                            const users = superdesk.entities.users.getAllUsers();
                            const byUserByDateAll = getItemsByUserByDate(itemsAll._items);
                            const byUserByDateFiltered = getItemsByUserByDate(itemsFiltered._items);

                            return (
                                <WeeklyCalendarGrid style={{padding: 'var(--space--2)'}}>
                                    {/* grid headers */}
                                    <WeeklyCalendarGridItem /> {/** spacer for user column */}
                                    {days.map((day, i) => (
                                        <WeeklyCalendarGridItem key={i}>
                                            <WeekViewHeaderDay day={day} />
                                        </WeeklyCalendarGridItem>
                                    ))}

                                    {Array.from(participantIds)
                                        .filter((participantId) => {
                                            if (filters.status === null) { // not set, usage of triple-equals required
                                                return days.some((day) => {
                                                    const dayIso = formatDateIso(day);

                                                    return byUserByDateFiltered[participantId]?.[dayIso] == null;
                                                });
                                            } else {
                                                return byUserByDateFiltered[participantId] != null;
                                            }
                                        })
                                        .map((userId) => {
                                            const user = users[userId];

                                            return (
                                                <React.Fragment key={user._id}>
                                                    <WeeklyCalendarGridItem> {/** avatar cell */}
                                                        <CalendarWeekDayItem coloredBg={true}>
                                                            <UserAvatar userId={user._id} />
                                                            <SpacerBlock v gap="8" />
                                                            <Text size='medium' noMargin>
                                                                {user.display_name}
                                                            </Text>
                                                            <SpacerBlock v gap="4" />
                                                            <Text size='small' color='light' noMargin>
                                                                @{user.sign_off}
                                                            </Text>
                                                        </CalendarWeekDayItem>
                                                    </WeeklyCalendarGridItem>

                                                    {days.map((day, i) => {
                                                        const dayISo = formatDateIso(day);

                                                        // filtering only applies to users
                                                        // all daily availability records are shown in weekly view
                                                        const [item] =
                                                            byUserByDateFiltered?.[user._id]?.[dayISo]
                                                            ?? byUserByDateAll?.[user._id]?.[dayISo]
                                                            ?? [];

                                                        if (item == null) {
                                                            return (<WeeklyCalendarGridItem key={i} />);
                                                        }

                                                        return (
                                                            <WeeklyCalendarGridItem key={i}>
                                                                <Weekday item={item} />
                                                            </WeeklyCalendarGridItem>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                </WeeklyCalendarGrid>
                            );
                        }}
                    </WithAvailabilityRecordsQuery>
                )}
            </WithAvailabilityRecordsQuery>
        );
    }
}

function getItemsByUserByDate(
    items: Array<IAvailabilityRecord>
): {[userId: string]: {[date: string]: Array<IAvailabilityRecord>}} {
    const byUser = groupBy(items, ({user}) => user);
    const byUserByDate: {[userId: string]: {[date: string]: Array<IAvailabilityRecord>}} = {};

    for (const [userId, items] of Object.entries(byUser)) {
        byUserByDate[userId] = groupBy(items, ({date}) => date);
    }

    return byUserByDate;
}

const Weekday: React.FunctionComponent<{item: IAvailabilityRecord}> = ({item}) => {
    const calendarWeekDayState = (() => {
        if (item.status === 'available') {
            return 'success';
        } else if (item.status === 'unavailable') {
            return 'alert';
        } else if (item.status === 'partial') {
            return 'warning';
        } else {
            return assertNever(item.status);
        }
    })();

    switch (item.status) {
        case 'available':
        case 'unavailable':
            return (
                <CalendarWeekDayItem
                    state={calendarWeekDayState}
                    coloredBg={true}
                >
                    <Text size="small">
                        {getLabelForStatus(item.status)}
                    </Text>

                    <Spacer h gap="0" justifyContent="end" noWrap>
                        <span />

                        <TagsPreview
                            tags={item.working_hours?.[0]?.tags ?? []}
                            justifyContent="end"
                        />
                    </Spacer>
                </CalendarWeekDayItem>
            );
        case 'partial':
            return (
                <>
                    {(item.working_hours ?? []).map((hours, i) => (
                        <CalendarWeekDayItem
                            state={calendarWeekDayState}
                            coloredBg={true}
                            key={i}
                        >
                            <Spacer key={i} gap="16" justifyContent="end" noWrap>
                                <TagsPreview tags={hours.tags} justifyContent="start" />

                                <span
                                    style={{
                                        whiteSpace: 'nowrap',
                                        color: 'var(--color-text-light)',
                                    }}
                                >
                                    {hours.start_time} - {hours.end_time}
                                </span>
                            </Spacer>
                        </CalendarWeekDayItem>
                    ))}
                </>
            );
        default:
            return assertNever(item);
    }
}
