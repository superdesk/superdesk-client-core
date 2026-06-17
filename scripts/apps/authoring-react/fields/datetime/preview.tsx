import {formatDateTime} from 'core/get-superdesk-api-implementation';
import React from 'react';
import {IDateTimeFieldConfig, IDateTimeValueOperational, IPreviewComponentProps} from 'superdesk-api';

type IProps = IPreviewComponentProps<IDateTimeValueOperational, IDateTimeFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <div>{formatDateTime(this.props.value)}</div>
        );
    }
}
