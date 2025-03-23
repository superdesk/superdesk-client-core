import {Spacer, SpacerBlock} from '@sourcefabric/common';
import * as React from 'react';
import {Icon, IconButton, Label, Text} from 'superdesk-ui-framework/react';
import {IAvailabilityRecord} from '../interfaces';
import {Separator} from '../separator';
import {superdesk} from '../superdesk';

const {locale, gettext} = superdesk.localization;

interface IProps {
    day: IAvailabilityRecord;
    onChange(day: IAvailabilityRecord): void;
    onRemove(day: IAvailabilityRecord): void;
    onCloseView(): void;
}

export class WorkingDayView extends React.PureComponent<IProps> {
    render() {
        const workingHours: IAvailabilityRecord['working_hours'] = this.props.day?.working_hours ?? [];

        return (
            <>
                <Spacer h gap="0" justifyContent="end" noWrap>
                    <IconButton
                        icon="pencil"
                        ariaValue={gettext('Edit')}
                        onClick={() => {
                            //
                        }}
                    />

                    <IconButton
                        icon="trash"
                        ariaValue={gettext('Remove')}
                        onClick={() => {
                            //
                        }}
                    />

                    <SpacerBlock h gap="4" />

                    <Separator length="50%" color="var(--color-text-light)" />

                    <SpacerBlock h gap="4" />

                    <IconButton
                        icon="close-small"
                        ariaValue={gettext('Close')}
                        onClick={() => {
                            this.props.onCloseView();
                        }}
                    />
                </Spacer>

                <Text size="small">
                    {
                        new Intl.DateTimeFormat(locale.code, {
                            year: 'numeric',
                            month: 'long',
                            weekday: 'long',
                            day: 'numeric',
                        }).format(new Date(this.props.day.date))
                    }
                </Text>

                <div>
                    {workingHours.map((entry, i) => (
                        <Spacer key={i} h gap="4" noWrap alignItems="center" justifyContent="start">
                            <Icon name="time" />

                            <div style={{whiteSpace: 'nowrap'}}>
                                {entry.start_time} - {entry.end_time}
                            </div>

                            {
                                (entry.tags ?? []).map((tag) => {
                                    // PR-TODO: should label name from a vocabulary be used?
                                    return (
                                        <Label key={tag.code} text={tag.name} size="small" />
                                    );
                                })
                            }
                        </Spacer>
                    ))}
                </div>

                <div>
                    <span>
                        {gettext('Language')}:
                    </span>

                    <span>
                        {/* PR-TODO: use value from database */}
                        English
                    </span>
                </div>
            </>
        );
    }
}
