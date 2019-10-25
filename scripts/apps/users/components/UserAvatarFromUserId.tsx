/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IUser} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    userId: string;
}

interface IState {
    user?: IUser;
}

class UserAvatarFromUserIdComponent extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        if (this.state.user == null) {
            dataApi.findOne<IUser>('users', this.props.userId).then((user) => {
                this.setState({user});
            });
        }
    }
    render() {
        const {user} = this.state;

        if (user == null) {
            return null;
        }

        return (
            <CC.UserAvatar user={user}/>
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
