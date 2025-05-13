import * as React from 'react';
import {Spacer, SpacerBlock} from '@sourcefabric/common';
import {addDays} from 'date-fns';
import {groupBy, range} from 'lodash';
import {IUser} from 'superdesk-api';
import {CalendarWeekDayItem, Text, WeeklyCalendarGrid, WeeklyCalendarGridItem} from 'superdesk-ui-framework/react';
import {TagsPreview} from '../components/tags-preview';
import {IAvailabilityRecord, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {formatDateIso, getLabelForStatus} from '../utils';
import {getQueryWithFilters} from './get-query-with-filters';
import {WeekViewHeaderDay} from './week-view-header-day';

const WithAvailabilityRecordsQuery = superdesk.components.getLiveQueryHOC<IAvailabilityRecord>();
const {UserAvatar} = superdesk.components;
const {assertNever} = superdesk.helpers;

interface IProps {
    filters: IFilters;
}

export class WeekView extends React.PureComponent<IProps> {
    render() {
        const {filters} = this.props;
        const days = range(0, 7).map((daysToAdd) => addDays(filters.date, daysToAdd));

        return (
            <WithAvailabilityRecordsQuery
                resource="user_availability"
                query={getQueryWithFilters(filters, filters.date, days[days.length - 1])}
            >
                {(res) => {
                    const users: Array<IUser> = Object.values(superdesk.entities.users.getAllUsers());
                    const byUser = groupBy(res._items, ({user}) => user);

                    const byUserByDate: {[userId: string]: {[date: string]: Array<IAvailabilityRecord>}} = {};

                    for (const [userId, items] of Object.entries(byUser)) {
                        byUserByDate[userId] = groupBy(items, ({date}) => date);
                    }

                    return (
                        <WeeklyCalendarGrid style={{padding: 'var(--space--2)'}}>
                            {/* grid headers */}
                            <WeeklyCalendarGridItem /> {/** spacer for user column */}
                            {days.map((day, i) => (
                                <WeeklyCalendarGridItem key={i}>
                                    <WeekViewHeaderDay day={day} />
                                </WeeklyCalendarGridItem>
                            ))}

                            {
                                users.map((user) => {
                                    return (
                                        <React.Fragment key={user._id}>
                                            <WeeklyCalendarGridItem>
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
                                                const [item] = byUserByDate?.[user._id]?.[dayISo] ?? [];

                                                if (item == null) {
                                                    return (<WeeklyCalendarGridItem />);
                                                }

                                                return (
                                                    <WeeklyCalendarGridItem key={i}>
                                                        <Weekday item={item}  />
                                                    </WeeklyCalendarGridItem>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })
                            }
                        </WeeklyCalendarGrid>
                    );
                }}
            </WithAvailabilityRecordsQuery>
        );
    }
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
