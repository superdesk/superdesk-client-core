import React from 'react';
import {DatePicker} from 'superdesk-ui-framework/react';
import {isValid, startOfDay} from 'date-fns';
import {appConfig} from 'appConfig';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';

interface IProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  required?: boolean;
  minDate?: Date | null;
}

export class DatePickerWrapper extends React.PureComponent<IProps> {
    render() {
        const {value, onChange, label, minDate, required = false} = this.props;

        return (
            <DatePicker
                label={label}
                value={value}
                onChange={(val) => {
                    if (!isValid(val) && val !== null) return;
                    onChange(val);
                }}
                locale={{
                    type: 'full',
                    payload: getLocaleForDatePicker(),
                }}
                dateFormat={appConfig.view.dateformat}
                required={required}
                minDate={minDate ?? startOfDay(new Date())}
            />
        );
    }
}
