import React from 'react';
import {IDurationFieldConfig, IDurationValueOperational, IPreviewComponentProps} from 'superdesk-api';

type IProps = IPreviewComponentProps<IDurationValueOperational, IDurationFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        // TODO: format before displaying; duration

        return (
            <div>{this.props.value}</div>
        );
    }
}
