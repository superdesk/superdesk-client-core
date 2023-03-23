import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IConfig, IValueOperational} from './interfaces';
import {superdesk} from './superdesk';

const {formatDateTime} = superdesk.localization;

export class Preview extends React.PureComponent<IPreviewComponentProps<IValueOperational, IConfig>> {
    render() {
        if (this.props.value == null) {
            return null;
        } else {
            return <div>{formatDateTime(new Date(this.props.value))}</div>;
        }
    }
}
