import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IConfig, IValueOperational} from './interfaces';

type IProps = IPreviewComponentProps<IValueOperational, IConfig>;

export class PredefinedFieldPreview extends React.PureComponent<IProps> {
    render() {
        return (
            <div dangerouslySetInnerHTML={{__html: this.props.value}} />
        );
    }
}
