import {ISuperdesk, ITemplateEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import set from 'date-fns/set';
import format from 'date-fns/format';
import addMinutes from 'date-fns/addMinutes';
import {IDateTimeFieldConfig} from './extension';
import {DatePickerISO, TimePicker, Button, Switch} from 'superdesk-ui-framework/react';
import {Radio, CheckGroup} from 'superdesk-ui-framework';

interface ITemplateDateTimeFieldState {
    radioValue: string | null;
    previousValue: any;
}

function isDateValue(value: any) {
    return !!Date.parse(value);
}

export function getTemplateDateTimeField(superdesk: ISuperdesk) {
    const {gettext, gettextPlural} = superdesk.localization;
    const {getLocaleForDatePicker} = superdesk.ui.framework;
    const {Spacer} = superdesk.components;
    const {dateToServerString} = superdesk.utilities;
    const currentDateTime = '{{ now }}';

    return class TemplateDateTimeField extends
        React.PureComponent<ITemplateEditorComponentProps<string | null, IDateTimeFieldConfig>,
        ITemplateDateTimeFieldState> {
        constructor(props: any) {
            super(props);

            this.state = {
                radioValue: isDateValue(this.props.value) ? this.props.value : 'setCurrentDate',
                previousValue: new Date(),
            };

            this.onRadioValueChange = this.onRadioValueChange.bind(this);
        }

        onRadioValueChange(radioValue: any) {
            this.setState({radioValue});
            if (radioValue === 'setCurrentDate') {
                this.props.setValue(currentDateTime);
            } else {
                this.props.setValue(this.state.previousValue);
            }
        }

        render() {
            const checkbox = (
                <Switch
                    value={this.props.value != null}
                    onChange={(value) => {
                        if (value) {
                            this.props.setValue(
                                dateToServerString(addMinutes(new Date(), this.props.config.initial_offset_minutes),
                                ));
                            this.onRadioValueChange('setCurrentDate');
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
                let isDate = isDateValue(this.props.value);
                let date = new Date();

                if (isDate) {
                    date = new Date(this.props.value);
                }

                const day = format(date, 'yyyy-MM-dd'); // ISO8601
                const hour = format(date, 'HH:mm'); // ISO8601

                const steps = this.props.config?.increment_steps ?? [];

                // Get the DatePicker locale using the language of this item
                const language = this.props.item.language ?? superdesk.instance.config.default_language;
                const datePickerLocale = getLocaleForDatePicker(language);

                return (
                    <Spacer type="horizontal" align="center" spacing="medium">
                        {checkbox}
                        {this.props.value &&
                            (
                                <CheckGroup>
                                    {this.state.radioValue}
                                    <Radio
                                        value={this.state.radioValue || undefined}
                                        options={[
                                            {
                                                value: 'setCurrentDate',
                                                label: 'Always choose current date',
                                            },
                                            {
                                                value: 'showDate',
                                                label: 'Choose a date',
                                            },
                                        ]}
                                        onChange={(val) => this.onRadioValueChange(val)}
                                    />
                                </CheckGroup>
                            )
                        }
                        {this.state.radioValue === 'showDate' &&
                        (
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
                                        this.setState({previousValue: this.props.value});
                                    }}
                                />

                                <div style={{display: 'flex', alignItems: 'center', height: '100%'}}>
                                    <span>@</span>
                                </div>

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
                                        this.setState({previousValue: this.props.value});
                                    }}
                                />
                            </Spacer>
                        )
                        }
                        {
                            steps.length < 1 || this.state.radioValue !== 'showDate'
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
                                                            this.setState({previousValue: this.props.value});
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
