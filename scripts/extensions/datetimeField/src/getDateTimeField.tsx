import {ISuperdesk, IEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import set from 'date-fns/set';
import format from 'date-fns/format';
import addMinutes from 'date-fns/addMinutes';
import {IDateTimeFieldConfig} from './extension';
import {DatePickerISO, TimePicker, Button, Switch} from 'superdesk-ui-framework';

export function getDateTimeField(superdesk: ISuperdesk) {
    const {gettext, gettextPlural} = superdesk.localization;
    const {Spacer} = superdesk.components;

    return class DateTimeField extends React.PureComponent<IEditorComponentProps<string | null, IDateTimeFieldConfig>> {
        render() {
            const checkbox = (
                <Switch
                    value={this.props.value != null}
                    onChange={(value) => {
                        if (value) {
                            this.props.setValue(new Date().toISOString());
                        } else {
                            this.props.setValue(null);
                        }
                    }}
                />
            );

            if (this.props.value == null) {
                return (
                    <div>
                        {checkbox}
                    </div>
                );
            } else {
                const date = addMinutes(new Date(this.props.value), this.props.config.initial_offset_minutes);

                const day = date == null ? '' : format(date, 'yyyy-MM-dd'); // ISO8601
                const hour = date == null ? '' : format(date, 'HH:mm'); // ISO8601

                const steps = this.props.config?.increment_steps ?? [];

                return (
                    <Spacer type="horizontal" align="center" spacing="medium">
                        {checkbox}

                        <Spacer type="horizontal" align="stretch" spacing="medium">
                            <DatePickerISO
                                value={day}
                                onChange={(dateString) => {
                                    if (dateString === '') {
                                        this.props.setValue(null);
                                        return;
                                    }

                                    const [yearStr, monthStr, dayStr] = dateString.split('-');
                                    const nextDate = date ?? new Date();

                                    this.props.setValue(
                                        set(
                                            nextDate,
                                            {
                                                year: parseInt(yearStr, 10),
                                                month: parseInt(monthStr, 10) - 1,
                                                date: parseInt(dayStr, 10),
                                            },
                                        ).toISOString(),
                                    );
                                }}
                            />

                            <div style={{display: 'flex', alignItems: 'center', height: '100%'}}><span>@</span></div>

                            <TimePicker
                                required // because it's a part of the date-time
                                value={hour}
                                onChange={(value) => {
                                    const [hours, minutes] = value.split(':');

                                    this.props.setValue(
                                        set(
                                            date,
                                            {
                                                hours: parseInt(hours, 10),
                                                minutes: parseInt(minutes, 10),
                                            },
                                        ).toISOString(),
                                    );
                                }}
                            />
                        </Spacer>

                        {
                            steps.length < 1
                                ? null
                                : (
                                    <div>
                                        {
                                            steps.map((step, i) => {
                                                const stepAbsolute = Math.abs(step);
                                                const fullHours = Math.floor(stepAbsolute / 60);
                                                const remainingMinutes = stepAbsolute % 60;

                                                let buttonText = '';

                                                if (step >= 0) {
                                                    buttonText += '+';
                                                } else {
                                                    buttonText += '-';
                                                }

                                                if (fullHours > 0) {
                                                    buttonText += ' ' + gettextPlural(
                                                        fullHours,
                                                        '{{x}} hour',
                                                        '{{x}} hours',
                                                        {x: fullHours},
                                                    );
                                                }

                                                if (remainingMinutes > 0) {
                                                    buttonText += ' ' + gettext('{{x}} min', {x: remainingMinutes});
                                                }

                                                return (
                                                    <Button
                                                        key={i}
                                                        disabled={date == null}
                                                        onClick={() => {
                                                            if (date != null) {
                                                                this.props.setValue(
                                                                    addMinutes(date, step).toISOString(),
                                                                );
                                                            }
                                                        }}
                                                        text={buttonText}
                                                        style="hollow"
                                                        size="small"
                                                    />
                                                );
                                            })
                                        }
                                    </div>
                                )
                        }
                    </Spacer>
                );
            }
        }
    };
}
