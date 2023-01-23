import React from 'react';
import {
    IDatelineFieldConfig,
    IDatelineValueOperational,
    IPreviewComponentProps,
} from 'superdesk-api';

type IProps = IPreviewComponentProps<IDatelineValueOperational, IDatelineFieldConfig>;

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
