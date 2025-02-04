import React from 'react';
import {IDurationFieldConfig, IDurationValueOperational, IPreviewComponentProps} from 'superdesk-api';
import {getDurationString} from 'superdesk-ui-framework/react/components/DurationInput';

type IProps = IPreviewComponentProps<IDurationValueOperational, IDurationFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <div>{getDurationString(this.props.value)}</div>
        );
    }
}
