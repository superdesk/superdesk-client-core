import React from 'react';
import {IUser} from 'superdesk-api';
import UserActivityWidget from './UserActivityWidget';

export default class UserActivityWidgetWithUser extends React.Component<{user: IUser}, {user: IUser}> {
    constructor(props) {
        super(props);

        this.state = {
            user: this.props.user,
        };
    }

    render() {
        return (
            <UserActivityWidget user={this.state.user} onUserChange={(user) => this.setState({user})} />
        );
    }
}
