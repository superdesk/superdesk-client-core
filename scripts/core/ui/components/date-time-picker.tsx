import React from 'react';
import {DatePicker, TimePicker, Button} from 'superdesk-ui-framework';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import {Spacer} from './Spacer';

interface IProps {
    value: Date;
    onChange(value: Date): void;
    required?: boolean;
    'data-test-id'?: string;
}

function getTimeISO(date: Date | null): string {
    if (date == null) {
        return '';
    }

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

export class DateTimePicker extends React.PureComponent<IProps> {
    /**
     * time picker sometimes sends empty string in onChange handler
     * and expects that to be passed as value on next render
     * otherwise it skips a character
     */
    private applyTimePickerHack: boolean; // TODO: convert to stateful component; sync via state reset(key)

    constructor(props: IProps) {
        super(props);

        this.applyTimePickerHack = false;
    }

    render() {
        const {value} = this.props;

        return (
            <Spacer
                h
                gap="8"
                noWrap
                alignItems="center"
                justifyContent="space-evenly"
                data-test-id={this.props['data-test-id']}
            >
                <DatePicker
                    label=""
                    inlineLabel
                    labelHidden
                    value={value}
                    onChange={(val) => {
                        this.props.onChange(val);
                    }}
                    dateFormat={appConfig.view.dateformat}
                    data-test-id="date-input"
                />
                <TimePicker
                    label=""
                    inlineLabel
                    labelHidden
                    value={this.applyTimePickerHack ? '' : getTimeISO(value)}
                    onChange={(timeNext) => {
                        if (timeNext === '') {
                            this.applyTimePickerHack = true;
                            this.forceUpdate();
                            return;
                        }

                        this.applyTimePickerHack = false;

                        const [hoursStr, minutesStr] = timeNext.split(':');
                        const copiedDate = new Date(value?.getTime() ?? new Date());

                        copiedDate.setHours(parseInt(hoursStr, 10));
                        copiedDate.setMinutes(parseInt(minutesStr, 10));

                        this.props.onChange(copiedDate);
                    }}
                    required={this.props.required}
                    data-test-id="time-input"
                />
                <Button
                    text={gettext('Clear')}
                    onClick={() => {
                        this.props.onChange(null);
                    }}
                    icon="close-small"
                    iconOnly
                    style="hollow"
                />
            </Spacer>
        );
    }
}
