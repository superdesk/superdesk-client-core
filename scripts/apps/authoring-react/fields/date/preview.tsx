import React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {formatDate} from 'core/get-superdesk-api-implementation';
import {IDateFieldConfig, IDateValueOperational} from './interfaces';

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
