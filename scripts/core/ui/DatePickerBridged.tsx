import React from 'react';
import {ReactNode} from 'react';
import {appConfig} from 'appConfig';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';
import {DatePickerISO} from 'superdesk-ui-framework';
import moment from 'moment';

interface IDatePickerBridgedProps {
    value?: string;
    label: string;
    extraId: string;
    filterId: string;
    dateFormat: string;
    onChange: (fieldId: string, next: string) => void;
}

export class ReactDatePickerBridged extends React.Component<IDatePickerBridgedProps> {
    render(): ReactNode {
        return (
            <DatePickerISO
                dateFormat={appConfig.view.dateformat}
                locale={{type: 'full', payload: getLocaleForDatePicker()}}
                onChange={(next) => {
                    const formattedDate = moment(next).format(appConfig.model.dateformat);

                    this.props.onChange(this.props.filterId + this.props.extraId, formattedDate);
                }}
                label={this.props.label}
                value={this.props.value ?? ''}
                hideClearButton
            />
        );
    }
}
