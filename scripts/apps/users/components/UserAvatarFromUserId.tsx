/* eslint-disable react/no-multi-comp */

import React from 'react';
import {UserAvatar} from './UserAvatar';
import {dataStore} from 'data-store';

interface IProps {
    userId: string;
}

class UserAvatarFromUserIdComponent extends React.PureComponent<IProps> {
    render() {
        const user = dataStore.users.get(this.props.userId);

        if (user == null) {
            return null;
        }

        return (
            <UserAvatar user={user} />
        );
    }
}

export class UserAvatarFromUserId extends React.PureComponent<IProps> {
    render() {
        // the component has state derived from props and must be re-mounted when props change
        // that is what `key={this.props.userId}` does.

        return <UserAvatarFromUserIdComponent key={this.props.userId} userId={this.props.userId} />;
    }
}
