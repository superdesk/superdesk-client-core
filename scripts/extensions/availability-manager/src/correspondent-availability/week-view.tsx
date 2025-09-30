import * as React from 'react';
import {classnames, Spacer, SpacerBlock} from '@sourcefabric/common';
import {addDays} from 'date-fns';
import {range} from 'lodash';
import {
    CalendarWeekDayItem,
    Text,
    WeeklyCalendarGrid,
    WeeklyCalendarGridItem,
} from 'superdesk-ui-framework/react';
import {TagsPreview} from '../components/tags-preview';
import {IAvailabilityRecord, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {formatDateIso, getDashboardLabelForStatus, getTextColorForStatus} from '../utils';
import {WeekViewHeaderDay} from './week-view-header-day';
import {IUser} from 'superdesk-api';
import {WithAvailabilityRecords} from './with-availability-records';
import {fetchParticipants, filterParticipants} from './participants';
import {showEditAvailabilityModal} from './show-edit-availability-modal';
import {MaybeButton} from '../components/maybe-button';
import {privileges} from '../constants';
import {compareUsers} from './sort-availability-records';

const {UserAvatar} = superdesk.components;
const {assertNever} = superdesk.helpers;
const {hasPrivilege} = superdesk.privileges;
const {getClass} = superdesk.utilities.CSS;

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
        };
    }

    componentDidMount(): void {
        fetchParticipants().then((items) => {
            this.setState({participantIds: items});
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
            <WithAvailabilityRecords dateFrom={dateFrom} dateTo={dateTo} filters={this.props.filters}>
                {({byUserByDateAll, byUserByDateFiltered}) => {
                    const users = superdesk.entities.users.getAllUsers();
                    const participants = filterParticipants({
                        participantIds: Array.from(participantIds),
                        days: days,
                        filters: filters,
                        byUserByDateFiltered,
                    }).sort((a, b) => compareUsers(users[a], users[b]));

                    return (
                        <WeeklyCalendarGrid style={{padding: 'var(--space--2)'}}>
                            {/* grid headers */}
                            <WeeklyCalendarGridItem /> {/** spacer for user column */}
                            {days.map((day, i) => (
                                <WeeklyCalendarGridItem key={i}>
                                    <WeekViewHeaderDay day={day} />
                                </WeeklyCalendarGridItem>
                            ))}

                            {participants
                                .map((userId) => {
                                    const user = users[userId];
                                    const canManageAvailability = hasPrivilege(privileges.user_availability_manage);

                                    return (
                                        <React.Fragment key={user._id}>
                                            <WeeklyCalendarGridItem> {/** avatar cell */}
                                                <CalendarWeekDayItem coloredBg={true}>
                                                    <MaybeButton
                                                        onClick={
                                                            canManageAvailability
                                                                ? () => showEditAvailabilityModal(user)
                                                                : undefined
                                                        }
                                                    >
                                                        <UserAvatar userId={user._id} />
                                                    </MaybeButton>

                                                    <SpacerBlock v gap="8" />

                                                    <MaybeButton
                                                        onClick={
                                                            canManageAvailability
                                                                ? () => showEditAvailabilityModal(user)
                                                                : undefined
                                                        }
                                                    >
                                                        <span
                                                            className={classnames(
                                                                getClass('username-weekly-view'),
                                                                {
                                                                    [getClass('link')]: canManageAvailability,
                                                                },
                                                            )}
                                                        >
                                                            {user.display_name}
                                                        </span>
                                                    </MaybeButton>

                                                    <SpacerBlock v gap="4" />
                                                    <Text size="small" color="light" noMargin>
                                                        @{user.username}
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

                                                if (item == null) { // placeholder
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
            </WithAvailabilityRecords>
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
                        {getDashboardLabelForStatus(item.status)}
                    </Text>

                    <Spacer h gap="0" justifyContent="end" noWrap>
                        <span />

                        <TagsPreview
                            tags={item.working_hours?.[0]?.tags ?? []}
                            justifyContent="end"
                            status={item.status}
                            origin="dashboard"
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
                            <Text size="small">
                                {getDashboardLabelForStatus(item.status)}
                            </Text>

                            <Spacer key={i} gap="16" justifyContent="end" noWrap>
                                <TagsPreview
                                    tags={hours.tags}
                                    justifyContent="start"
                                    status={item.status}
                                    origin="dashboard"
                                />

                                <span
                                    style={{
                                        whiteSpace: 'nowrap',
                                        color: getTextColorForStatus(item.status),
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
};
