import * as React from 'react';
import {difference, keyBy} from 'lodash';
import {BoxedList, BoxedListItem, Label} from 'superdesk-ui-framework/react';
import {Spacer} from '@sourcefabric/common';
import {IUser} from 'superdesk-api';
import {TagsPreview} from '../components/tags-preview';
import {IAvailabilityRecord, IFilters} from '../interfaces';
import {superdesk} from '../superdesk';
import {fetchParticipants, filterParticipants} from './participants';
import {compareUsersByName, sortAvailabilityRecords} from './sort-availability-records';
import {WithAvailabilityRecords} from './with-availability-records';
import {showEditAvailabilityModal} from './show-edit-availability-modal';

const {assertNever} = superdesk.helpers;
const {UserAvatar} = superdesk.components;
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
                    ).sort((a, b) => compareUsersByName(users[a], users[b]));

                    const participantsIds = filterParticipants({
                        participantIds: [
                            ...usersWithRecord,
                            ...usersWithoutRecord,
                        ],
                        days: [filters.date],
                        filters: filters,
                        byUserByDateFiltered,
                    });

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
                                        coloredBg={record != null && record.status !== 'available'}
                                        density="compact"
                                    >
                                        <Spacer gap="32" alignItems="center" justifyContent="space-between" noGrow>
                                            <div>
                                                <Spacer gap="8" alignItems="center" justifyContent="start" noGrow>
                                                    <button
                                                        onClick={() => {
                                                            showEditAvailabilityModal(user);
                                                        }}
                                                        style={{padding: 0, cursor: 'pointer'}}
                                                    >
                                                        <UserAvatar userId={user._id} />
                                                    </button>

                                                    <button
                                                        className={getClass('username-day-view')}
                                                        onClick={() => {
                                                            showEditAvailabilityModal(user);
                                                        }}
                                                    >
                                                        {user.display_name}
                                                    </button>

                                                    <span style={{color: 'var(--color-text-light)'}}>
                                                        @{user.sign_off}
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
                                                                    />

                                                                    <span
                                                                        style={{
                                                                            whiteSpace: 'nowrap',
                                                                            color: 'var(--color-text-light)',
                                                                        }}
                                                                    >
                                                                        {hours.start_time} - {hours.end_time}
                                                                    </span>
                                                                </Spacer>
                                                            ))}
                                                        </Spacer>
                                                    );
                                                } else {
                                                    return (
                                                        <Spacer h gap="0" justifyContent="end" noWrap>
                                                            <span />
                                                            <TagsPreview
                                                                tags={record.working_hours?.[0]?.tags ?? []}
                                                                justifyContent="end"
                                                            />
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
