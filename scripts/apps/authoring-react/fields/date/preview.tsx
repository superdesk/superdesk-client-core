import React from 'react';
import {IDateFieldConfig, IDateValueOperational, IPreviewComponentProps} from 'superdesk-api';
import {formatDate} from 'core/get-superdesk-api-implementation';

type IProps = IPreviewComponentProps<IDateValueOperational, IDateFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <div>{formatDate(new Date(this.props.value))}</div>
        );
    }
}
