import * as React from 'react';
import {IPlainTextFieldConfig, IPlainTextFieldValueOperational, IPreviewComponentProps} from 'superdesk-api';

export class Preview extends React.PureComponent<
    IPreviewComponentProps<IPlainTextFieldValueOperational, IPlainTextFieldConfig>
> {
    render() {
        return <span>{this.props.value}</span>;
    }
}
