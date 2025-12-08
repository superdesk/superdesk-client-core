import React from 'react';
import {IInputType} from '../interfaces/input-types';
import {CopyableTextBox} from 'superdesk-ui-framework/react';

export class ReadonlyCopyableText extends React.Component<IInputType<string>> {
    render() {
        return (
            <CopyableTextBox
                value={this.props.value ?? '* * * * * * * *'}
            />
        );
    }
}
