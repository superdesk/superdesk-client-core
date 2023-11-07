import * as React from 'react';
import {ICommonFieldConfig, IPreviewComponentProps} from 'superdesk-api';
import {IValueOperational} from './interfaces';
import {Switch} from 'superdesk-ui-framework/react';
import {noop} from 'lodash';

export class Preview extends React.PureComponent<IPreviewComponentProps<IValueOperational, ICommonFieldConfig>> {
    render() {
        return (
            <Switch
                label={{content: ''}}
                onChange={noop}
                value={this.props.value as boolean}
                disabled={true}
            />
        );
    }
}
