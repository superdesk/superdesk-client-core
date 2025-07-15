import React from 'react';
import {DateTimePicker} from 'superdesk-ui-framework/react';
import {isValid} from 'date-fns';
import {appConfig} from 'appConfig';

interface IProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  required?: boolean;
}

export class DateTimePickerWrapper extends React.PureComponent<IProps> {
    render() {
        const {value, onChange, label, required = false} = this.props;

        return (
            <DateTimePicker
                label={label}
                value={value}
                onChange={(val) => {
                    if (!isValid(val) && val !== null) return;
                    onChange(val);
                }}
                valueType="date"
                dateFormat={appConfig.view.dateformat}
                required={required}
            />
        );
    }
}
