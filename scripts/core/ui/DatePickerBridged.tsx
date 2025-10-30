import React from 'react';
import moment from 'moment';
import {appConfig} from 'appConfig';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';
import {DatePickerISO} from 'superdesk-ui-framework';

interface IDatePickerBridgedProps {
    value?: string;
    label: string;
    extraId: string;
    filterId: string;
    dateFormat: string;
    onChange: (fieldId: string, next: string) => void;
}

export const ReactDatePickerBridged: React.FC<IDatePickerBridgedProps> = (props) => {
    return (
        <DatePickerISO
            dateFormat={appConfig.view.dateformat}
            locale={{type: 'full', payload: getLocaleForDatePicker()}}
            onChange={(next) => {
                const formattedDate = moment(next).format(appConfig.model.dateformat);

                props.onChange(props.filterId + props.extraId, formattedDate);
            }}
            label={props.label}
            value={props.value ?? ''}
            hideClearButton
        />
    );
};
