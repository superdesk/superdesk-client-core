import React from 'react';
import {IUser} from 'superdesk-api';
import UserActivityWidget from './UserActivityWidget';
import ng from 'core/services/ng';

interface IState {
    user: IUser | 'loading';
}

export default class UserActivityWidgetWithUser extends React.Component<{}, IState> {
    constructor(props) {
        super(props);

        this.state = {
            user: 'loading',
        };
    }

    componentDidMount() {
        ng.get('session').getIdentity().then((user) => {
            this.setState({user});
        });
    }

    render() {
        if (this.state.user === 'loading') {
            return null;
        }

        return (
            <UserActivityWidget user={this.state.user} onUserChange={(user) => this.setState({user})} />
        );
    }
}
