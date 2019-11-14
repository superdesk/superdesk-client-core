import {ISuperdesk, IEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import set from 'date-fns/set';
import format from 'date-fns/format';
import addMinutes from 'date-fns/addMinutes';
import {IDateTimeFieldConfig, defaultDateTimeConfig} from './extension';

export function getDateTimeField(superdesk: ISuperdesk) {
    const {gettext, gettextPlural} = superdesk.localization;

    return class DateTimeField extends React.PureComponent<IEditorComponentProps<IDateTimeFieldConfig>> {
        render() {
            const selected = this.props.value != null;

            const date = this.props.value != null
                ? addMinutes(new Date(this.props.value), this.props.config.initial_offset_minutes)
                : null;

            const day = date == null ? '' : format(date, 'yyyy-MM-dd'); // ISO8601
            const hour = date == null ? '' : format(date, 'HH:mm'); // ISO8601

            const checkbox = (
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => {
                        if (event.target.value === 'on' && selected !== true) {
                            this.props.setValue(new Date().toISOString());
                        } else {
                            this.props.setValue(null);
                        }
                    }}
                />
            );

            if (!selected) {
                return (
                    <div>
                        {checkbox}
                    </div>
                );
            } else {
                return (
                    <div>
                        {checkbox}

                        <input
                            type="date"
                            value={day}
                            onChange={(event) => {
                                if (event.target.value === '') {
                                    this.props.setValue(null);
                                    return;
                                }

                                const value = event.target.value.split('-');
                                const nextDate = date ?? new Date();

                                this.props.setValue(
                                    set(
                                        nextDate,
                                        {
                                            year: parseInt(value[0], 10),
                                            month: parseInt(value[1], 10) - 1,
                                            date: parseInt(value[2], 10),
                                        },
                                    ).toISOString(),
                                );
                            }}
                            style={{width: 130}}
                        />

                        @

                        <input
                            type="time"
                            value={hour}
                            onChange={(event) => {
                                if (event.target.value === '' || date == null) {
                                    return;
                                }

                                const value = event.target.value.split(':');

                                this.props.setValue(
                                    set(
                                        date,
                                        {
                                            hours: parseInt(value[0], 10),
                                            minutes: parseInt(value[1], 10),
                                        },
                                    ).toISOString(),
                                );
                            }}
                            style={{width: 130}}
                        />

                        {
                            (this.props.config ?? defaultDateTimeConfig).increment_steps.map((step, i) => {
                                const stepAbsolute = Math.abs(step);
                                const fullHours = Math.floor(stepAbsolute / 60);
                                const remainingMinutes = stepAbsolute % 60;

                                return (
                                    <button
                                        key={i}
                                        disabled={date == null}
                                        onClick={() => {
                                            if (date != null) {
                                                this.props.setValue(addMinutes(date, step).toISOString());
                                            }
                                        }}
                                    >
                                        {
                                            step >= 0 ? '+ ' : '- '
                                        }
                                        {
                                            fullHours < 1
                                                ? null
                                                : gettextPlural(
                                                    fullHours,
                                                    '{{x}} hour',
                                                    '{{x}} hours',
                                                    {x: fullHours},
                                                ) + ' '
                                        }
                                        {
                                            remainingMinutes === 0
                                                ? null
                                                : gettext('{{x}} min', {x: remainingMinutes})
                                        }
                                    </button>
                                );
                            })
                        }

                    </div>
                );
            }
        }
    };
}
