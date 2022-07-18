import React from 'react';
import {IPreviewComponentProps, ITimeFieldConfig, ITimeValueOperational} from 'superdesk-api';

type IProps = IPreviewComponentProps<ITimeValueOperational, ITimeFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <div>{this.props.value}</div>
        );
    }
}
