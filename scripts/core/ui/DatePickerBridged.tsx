import {appConfig} from 'appConfig';
import moment from 'moment';
import React from 'react';
import {ReactNode} from 'react';
import {DatePickerISO} from 'superdesk-ui-framework';

interface IDatePickerBridgedProps {
    value?: string;
    label: string;
    extraId: string;
    filterId: string;
    dateFormat: string;
    onChange: (fieldId: string, next: string) => void;
}

export class ReactDatePickerBridged extends React.Component<IDatePickerBridgedProps, any> {
    render(): ReactNode {
        return (
            <DatePickerISO
                dateFormat={this.props.dateFormat}
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
