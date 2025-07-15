import React from 'react';
import {DatePicker} from 'superdesk-ui-framework/react';
import {isValid} from 'date-fns';
import {appConfig} from 'appConfig';

interface IProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  required?: boolean;
}

export class DatePickerWrapper extends React.PureComponent<IProps> {
    render() {
        const {value, onChange, label, required = false} = this.props;

        return (
            <DatePicker
                label={label}
                value={value}
                onChange={(val) => {
                    if (!isValid(val) && val !== null) return;
                    onChange(val);
                }}
                dateFormat={appConfig.view.dateformat}
                required={required}
            />
        );
    }
}
