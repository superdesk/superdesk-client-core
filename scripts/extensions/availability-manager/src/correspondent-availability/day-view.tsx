import * as React from 'react';
import {difference, keyBy} from 'lodash';
import {BoxedList, BoxedListItem, Label} from 'superdesk-ui-framework/react';
import {classnames, Spacer} from '@sourcefabric/common';
import {IUser} from 'superdesk-api';
import {TagsPreview} from '../components/tags-preview';
import {IAvailabilityRecord, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {fetchParticipants, filterParticipants} from './participants';
import {compareUsers, sortAvailabilityRecords} from './sort-availability-records';
import {WithAvailabilityRecords} from './with-availability-records';
import {showEditAvailabilityModal} from './show-edit-availability-modal';
import {privileges} from '../constants';
import {MaybeButton} from '../components/maybe-button';
import {getDashboardLabelForStatus, getTextColorForStatus} from '../utils';

const {assertNever} = superdesk.helpers;
const {UserAvatar} = superdesk.components;
const {hasPrivilege} = superdesk.privileges;
const {getClass} = superdesk.utilities.CSS;

interface IProps {
    filters: IFilters;
}

interface IState {
    // participants are users that have availability management enabled
    participantIds: Set<IUser['_id']> | null;
}

export class DayView extends React.PureComponent<IProps, IState> {
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
        const {filters} = this.props;
        const {participantIds} = this.state;

        if (participantIds == null) { // loading
            return null;
        }

        const users: {[key: string]: IUser} = superdesk.entities.users.getAllUsers();

        return (
            <WithAvailabilityRecords dateFrom={filters.date} dateTo={filters.date} filters={filters}>
                {({byUserByDateFiltered}) => {
                    const records: Array<IAvailabilityRecord> = [];

                    for (const byDate of Object.values(byUserByDateFiltered)) {
                        for (const _records of Object.values(byDate)) {
                            records.push(..._records);
                        }
                    }

                    const recordsByUser: {[userId: string]: IAvailabilityRecord} = keyBy(records, ({user}) => user);
                    const recordsSorted = sortAvailabilityRecords(records);
                    const usersWithRecord = recordsSorted.map(({user}) => user);
                    const usersWithoutRecord = difference(
                        Array.from(participantIds),
                        usersWithRecord,
                    ).sort((a, b) => compareUsers(users[a], users[b]));

                    const participantsIds = filterParticipants({
                        participantIds: [
                            ...usersWithRecord,
                            ...usersWithoutRecord,
                        ],
                        days: [filters.date],
                        filters: filters,
                        byUserByDateFiltered,
                    });

                    const canManageAvailability = hasPrivilege(privileges.user_availability_manage);

                    return (
                        <BoxedList style={{padding: 'var(--space--2)'}}>
                            {participantsIds.map((participantId) => {
                                const record = recordsByUser[participantId] as IAvailabilityRecord | null;
                                const user = users[participantId];

                                return (
                                    <BoxedListItem
                                        key={participantId}
                                        type={(() => {
                                            if (record == null) {
                                                return 'default';
                                            }

                                            switch (record.status) {
                                                case 'available':
                                                    return 'success';
                                                case 'partial':
                                                    return 'warning';
                                                case 'unavailable':
                                                    return 'alert';
                                                default:
                                                    return assertNever(record);
                                            }
                                        })()}
                                        coloredBg={record != null}
                                        density="compact"
                                    >
                                        <Spacer gap="32" alignItems="center" justifyContent="space-between" noGrow>
                                            <div>
                                                <Spacer gap="8" alignItems="center" justifyContent="start" noGrow>
                                                    <MaybeButton
                                                        onClick={
                                                            canManageAvailability ?
                                                                () => showEditAvailabilityModal(user)
                                                                : undefined
                                                        }
                                                    >
                                                        <UserAvatar userId={user._id} />
                                                    </MaybeButton>

                                                    <MaybeButton
                                                        onClick={
                                                            canManageAvailability ?
                                                                () => showEditAvailabilityModal(user)
                                                                : undefined
                                                        }
                                                    >
                                                        <span
                                                            className={classnames(
                                                                getClass('username-day-view'),
                                                                {
                                                                    [getClass('link')]: canManageAvailability,
                                                                },
                                                            )}
                                                        >
                                                            {user.display_name}
                                                        </span>
                                                    </MaybeButton>

                                                    <span style={{color: 'var(--color-text-light)'}}>
                                                        @{user.username}
                                                    </span>

                                                    {
                                                        record != null && (
                                                            <span>
                                                                {(record.language ?? [])
                                                                    .map((lang) => <Label text={lang} key={lang} />)}
                                                            </span>
                                                        )
                                                    }
                                                </Spacer>
                                            </div>

                                            {(() => {
                                                if (record == null) {
                                                    return null;
                                                } else if (record.status === 'partial') {
                                                    return (
                                                        <Spacer v gap="4">
                                                            {(record.working_hours ?? []).map((hours, i) => (
                                                                <Spacer key={i} gap="16" justifyContent="end" noWrap>
                                                                    <TagsPreview
                                                                        tags={hours.tags}
                                                                        justifyContent="end"
                                                                        status={record.status}
                                                                        origin="dashboard"
                                                                    />

                                                                    <span
                                                                        style={{
                                                                            whiteSpace: 'nowrap',
                                                                            color: getTextColorForStatus(record.status),
                                                                        }}
                                                                    >
                                                                        {getDashboardLabelForStatus(record.status)}
                                                                        {' '}
                                                                        {hours.start_time} - {hours.end_time}
                                                                    </span>
                                                                </Spacer>
                                                            ))}
                                                        </Spacer>
                                                    );
                                                } else {
                                                    return (
                                                        <Spacer h gap="16" justifyContent="end" noWrap>
                                                            <TagsPreview
                                                                tags={record.working_hours?.[0]?.tags ?? []}
                                                                justifyContent="end"
                                                                status={record.status}
                                                                origin="dashboard"
                                                            />

                                                            <span
                                                                style={{
                                                                    color: getTextColorForStatus(record.status),
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {getDashboardLabelForStatus(record.status)}
                                                            </span>
                                                        </Spacer>
                                                    );
                                                }
                                            })()}
                                        </Spacer>
                                    </BoxedListItem>
                                );
                            })}
                        </BoxedList>
                    );
                }}
            </WithAvailabilityRecords>
        );
    }
}
