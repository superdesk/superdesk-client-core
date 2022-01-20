import {ISuperdesk, IEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import set from 'date-fns/set';
import format from 'date-fns/format';
import addMinutes from 'date-fns/addMinutes';
import {IDateTimeFieldConfig} from './extension';
import {DatePickerISO, TimePicker, Button, Switch} from 'superdesk-ui-framework/react';

interface IPropsAdditional {
    hideToggle?: boolean;
}

export function getDateTimeField(superdesk: ISuperdesk) {
    const {gettext, gettextPlural} = superdesk.localization;
    const {getLocaleForDatePicker} = superdesk.ui.framework;
    const {Spacer} = superdesk.components;
    const {dateToServerString} = superdesk.utilities;

    return class DateTimeField
        extends React.PureComponent<IEditorComponentProps<string | null, IDateTimeFieldConfig> & IPropsAdditional> {
        render() {
            const checkbox = this.props.hideToggle !== true ? (
                <Switch
                    value={this.props.value != null}
                    onChange={(value) => {
                        if (value) {
                            this.props.setValue(
                                dateToServerString(addMinutes(new Date(), this.props.config.initial_offset_minutes)),
                            );
                        } else {
                            this.props.setValue(null);
                        }
                    }}
                />
            ) : null;

            if (this.props.value == null) {
                return (
                    <div>
                        {checkbox}
                    </div>
                );
            } else {
                const date = new Date(this.props.value);

                const day = format(date, 'yyyy-MM-dd'); // ISO8601
                const hour = format(date, 'HH:mm'); // ISO8601

                const steps = this.props.config?.increment_steps ?? [];

                // Get the DatePicker locale using the language of this item
                const language = this.props.language ?? superdesk.instance.config.default_language;
                const datePickerLocale = getLocaleForDatePicker(language);

                return (
                    <Spacer type="horizontal" align="center" spacing="medium">
                        {checkbox}

                        <Spacer type="horizontal" align="stretch" spacing="medium">
                            <DatePickerISO
                                dateFormat={superdesk.instance.config.view.dateformat}
                                locale={datePickerLocale}
                                value={day}
                                onChange={(dateString) => {
                                    if (dateString === '') {
                                        this.props.setValue(null);
                                        return;
                                    }

                                    const [yearStr, monthStr, dayStr] = dateString.split('-');

                                    this.props.setValue(
                                        dateToServerString(
                                            set(
                                                date,
                                                {
                                                    year: parseInt(yearStr, 10),
                                                    month: parseInt(monthStr, 10) - 1,
                                                    date: parseInt(dayStr, 10),
                                                },
                                            ),
                                        ),
                                    );
                                }}
                            />

                            <div style={{display: 'flex', alignItems: 'center', height: '100%'}}><span>@</span></div>

                            <div style={{display: 'flex', alignItems: 'center', height: '100%'}}>
                                <TimePicker
                                    required // because it's a part of the date-time
                                    value={hour}
                                    onChange={(value) => {
                                        const [hours, minutes] = value.split(':');

                                        this.props.setValue(
                                            dateToServerString(
                                                set(
                                                    date,
                                                    {
                                                        hours: parseInt(hours, 10),
                                                        minutes: parseInt(minutes, 10),
                                                    },
                                                ),
                                            ),
                                        );
                                    }}
                                />
                            </div>
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
                                                                    dateToServerString(addMinutes(date, step)),
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
