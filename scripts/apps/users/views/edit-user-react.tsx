import React, {ComponentProps} from 'react';
import {IUserProfileSection} from 'superdesk-api';

type IProps = ComponentProps<IUserProfileSection['component']> & {component: IUserProfileSection['component']};

export class EditUserReact extends React.PureComponent<IProps> {
    render() {
        const Component = this.props.component;

        return (
            <Component user={this.props.user} onSave={this.props.onSave} />
        );
    }
}