import React from 'react';
import {ITagInputFieldConfig, ITagInputValueOperational, IPreviewComponentProps} from 'superdesk-api';

type IProps = IPreviewComponentProps<ITagInputValueOperational, ITagInputFieldConfig>;

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
