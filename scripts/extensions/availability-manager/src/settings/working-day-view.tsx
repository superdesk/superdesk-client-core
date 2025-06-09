/* eslint-disable react/no-multi-comp */

import * as React from 'react';

import {Spacer, SpacerBlock, Divider} from '@sourcefabric/common';
import {Icon, IconButton, Tooltip, Text} from 'superdesk-ui-framework/react';
import {IAvailabilityRecord} from '../interfaces';
import {superdesk} from '../superdesk';
import {
    getLabelForStatus,
    getLocalizedDateString,
    getModifiedBySomeoneElseWarning,
    getStylesForStatusDot,
} from '../utils';
import {TagsPreview} from '../components/tags-preview';

const {locale, gettext} = superdesk.localization;

interface IProps {
    day: IAvailabilityRecord;
    onRemove(): void;
    onEdit(): void;
    onClose(): void;
}

export class WorkingDayView extends React.PureComponent<IProps> {
    render() {
        const {day} = this.props;
        const modifiedBySomeoneElseWarning = getModifiedBySomeoneElseWarning(day);

        return (
            <div data-test-id="working-day-view">
                <Spacer h gap="0" justifyContent="end" noWrap style={{paddingInline: 4, paddingBlockStart: 4}}>
                    <IconButton
                        icon="pencil"
                        ariaValue={gettext('Edit')}
                        onClick={() => {
                            this.props.onEdit();
                        }}
                    />

                    <IconButton
                        icon="trash"
                        ariaValue={gettext('Remove')}
                        onClick={() => {
                            this.props.onRemove();
                        }}
                    />

                    <SpacerBlock h gap="4" />

                    {/** PR-TODO: exact color variable needed */}
                    <Divider length="50%" color="var(--color-text-light)" />

                    <SpacerBlock h gap="4" />

                    <IconButton
                        icon="close-small"
                        ariaValue={gettext('Close')}
                        onClick={() => {
                            this.props.onClose();
                        }}
                    />
                </Spacer>

                <SpacerBlock v gap="8" />

                <Spacer
                    v
                    gap="8"
                    style={{
                        padding: 'calc(var(--base-increment) * 2)',
                        paddingInlineEnd: 'calc(var(--base-increment) * 5)',
                        paddingBlockStart: 'var(--base-increment) * 0.5',
                    }}
                    noWrap
                >
                    <Spacer h gap="8" justifyContent="start" noWrap>
                        <Tooltip text={getLabelForStatus(day.status)}>
                            <div
                                style={{
                                    ...getStylesForStatusDot(day.status),
                                    marginBlockStart: -2, // fixing vertical alignment
                                }}
                            />
                        </Tooltip>

                        <h3 style={{fontWeight: 'normal', fontSize: '1.6rem', lineHeight: '1em'}}>
                            {getLocalizedDateString(locale.code, new Date(day.date))}
                        </h3>
                    </Spacer>

                    {
                        (() => {
                            const workingHours: IAvailabilityRecord['working_hours'] =
                                day.working_hours ?? [];

                            if (workingHours.length < 1) {
                                return null;
                            }

                            if (day.status !== 'partial') {
                                return (
                                    <TagsPreview
                                        tags={(day.working_hours ?? [])[0]?.tags}
                                        status={day.status}
                                        origin="settings"
                                    />
                                );
                            } else {
                                return (
                                    <Spacer v gap="8" noWrap>
                                        {(day.working_hours ?? []).map((entry, i) => {
                                            const tags = entry.tags ?? [];

                                            return (
                                                <Spacer v gap="4" key={i} data-test-id="working-hours-record">
                                                    <Spacer
                                                        key={i}
                                                        h
                                                        gap="4"
                                                        noWrap
                                                        alignItems="center"
                                                        justifyContent="start"
                                                        data-test-id="time-range"
                                                    >
                                                        <Icon name="time" />

                                                        <div style={{whiteSpace: 'nowrap'}}>
                                                            {entry.start_time} - {entry.end_time}
                                                        </div>
                                                    </Spacer>

                                                    <TagsPreview tags={tags} status={day.status} origin="settings" />
                                                </Spacer>
                                            );
                                        })}
                                    </Spacer>
                                );
                            }
                        })()
                    }

                    {
                        modifiedBySomeoneElseWarning != null && (
                            <Text color="lighter" size="x-small" noMargin>
                                {modifiedBySomeoneElseWarning}
                            </Text>
                        )
                    }
                </Spacer>
            </div>
        );
    }
}
