import {Spacer} from '@sourcefabric/common';
import * as React from 'react';
import {IUser} from 'superdesk-api';
import {BoxedList, BoxedListItem, Label} from 'superdesk-ui-framework/react';
import {TagsPreview} from '../components/tags-preview';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {sortAvailabilityRecords} from './sort-availability-records';

const {assertNever} = superdesk.helpers;
const {UserAvatar} = superdesk.components;

interface IProps {
    items: Array<IAvailabilityRecord>;
}

export class DayView extends React.PureComponent<IProps> {
    render() {
        const {items} = this.props;

        if (items.length < 1) {
            return null;
        }

        const users: {[key: string]: IUser} = superdesk.entities.users.getAllUsers();

        return (
            <BoxedList>
                {
                    sortAvailabilityRecords(items).map((item, i) => {
                        const user = users[item.user];

                        return (
                            <BoxedListItem
                                key={i}
                                type={(() => {
                                    switch (item.status) {
                                        case 'available':
                                            return 'success';
                                        case 'partial':
                                            return 'warning';
                                        case 'unavailable':
                                            return 'alert';
                                        default:
                                            return assertNever(item);
                                    }
                                })()}
                                coloredBg={item.status !== 'available'}
                                density="compact"
                            >
                                <Spacer gap="32" alignItems="center" justifyContent="space-between" noGrow>
                                    <div>
                                        <Spacer gap="8" alignItems="center" justifyContent="start" noGrow>
                                            <UserAvatar userId={item.user} />

                                            <strong style={{color: 'var(--sd-colour-interactive--darken-20)'}}>
                                                {user.display_name}
                                            </strong>

                                            <span style={{color: 'var(--color-text-light)'}}>
                                                @{user.sign_off}
                                            </span>

                                            <span>
                                                {(item.language ?? []).map((lang) => <Label text={lang} key={lang} />)}
                                            </span>
                                        </Spacer>
                                    </div>

                                    {(() => {
                                        if (item.status === 'partial') {
                                            return (
                                                <Spacer v gap="4">
                                                    {(item.working_hours ?? []).map((hours, i) => (
                                                        <Spacer key={i} gap="16" justifyContent="end" noWrap>
                                                            <TagsPreview tags={hours.tags} justifyContent="end" />

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
                                                        tags={item.working_hours?.[0]?.tags ?? []}
                                                        justifyContent="end"
                                                    />
                                                </Spacer>
                                            );
                                        }
                                    })()}
                                </Spacer>
                            </BoxedListItem>
                        );
                    })
                }
            </BoxedList>
        );
    }
}
