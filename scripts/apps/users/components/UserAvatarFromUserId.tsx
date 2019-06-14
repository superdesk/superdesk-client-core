import React from 'react';
import {IUser} from 'superdesk-api';
import {UserAvatar} from '.';
import { dataApi } from 'core/helpers/CrudManager';

interface IProps {
    userId: string;
}

interface IState {
    user?: IUser;
}

export class UserAvatarFromUserId extends React.PureComponent<IProps, IState> {
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
            <UserAvatar
                displayName={user.display_name}
                pictureUrl={user.picture_url}
            />
        );
    }
}
