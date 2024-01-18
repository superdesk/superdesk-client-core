import {IEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import set from 'date-fns/set';
import format from 'date-fns/format';
import addMinutes from 'date-fns/addMinutes';
import {DatePickerISO, TimePicker, Button, Switch} from 'superdesk-ui-framework/react';
import {superdesk} from './superdesk';
import {IConfig, IValueOperational} from './interfaces';
import {getConfigWithDefaults} from './config';

const {gettext, gettextPlural} = superdesk.localization;
const {getLocaleForDatePicker} = superdesk.ui.framework;
const {Spacer} = superdesk.components;
const {dateToServerString} = superdesk.utilities;

type IProps = IEditorComponentProps<IValueOperational, IConfig, never>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const config = getConfigWithDefaults(this.props.config);

        const checkbox = (
            <Switch
                label={{content: ''}}
                value={this.props.value != null}
                onChange={(value) => {
                    if (value) {
                        this.props.onChange(
                            dateToServerString(addMinutes(new Date(), config.initial_offset_minutes)),
                        );
                    } else {
                        this.props.onChange(null);
                    }
                }}
            />
        );

        const Container = this.props.container;

        if (this.props.value == null) {
            return (
                <Container>
                    {checkbox}
                </Container>
            );
        } else {
            const date = new Date(this.props.value);
            const hour = format(date, 'HH:mm'); // ISO8601
            const steps = config.increment_steps;

            // Get the DatePicker locale using the language of this item
            const language = this.props.language ?? superdesk.instance.config.default_language;
            const datePickerLocale = getLocaleForDatePicker(language);

            return (
                <Container>
                    <Spacer h gap="8" justifyContent="start" noGrow>
                        {checkbox}

                        <Spacer h gap="8" noGrow>
                            <DatePickerISO
                                labelHidden
                                inlineLabel
                                label={gettext('Date')}
                                dateFormat={superdesk.instance.config.view.dateformat}
                                locale={datePickerLocale}
                                value={this.props.value} // must be full datetime here to avoid timezone conversion
                                onChange={(dateString) => {
                                    if (dateString === '') {
                                        this.props.onChange(null);
                                        return;
                                    }

                                    const [yearStr, monthStr, dayStr] = dateString.split('-');

                                    this.props.onChange(
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
                                    labelHidden
                                    inlineLabel
                                    required // because it's a part of the date-time
                                    value={hour}
                                    onChange={(value) => {
                                        const [hours, minutes] = value.split(':');

                                        this.props.onChange(
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
                            steps.length < 1 && (
                                <Spacer h gap="4" justifyContent="start" noGrow>
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
                                                            this.props.onChange(
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
                                </Spacer>
                            )
                        }
                    </Spacer>
                </Container>
            );
        }
    }
}
