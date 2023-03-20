import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IConfig, IValueOperational} from './interfaces';

type IProps = IPreviewComponentProps<IValueOperational, IConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null) {
            return null;
        }

        return (
            <div dangerouslySetInnerHTML={{__html: this.props.value}} />
        );
    }
}
