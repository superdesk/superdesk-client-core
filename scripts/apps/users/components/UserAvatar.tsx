import React from 'react';
import {IUser} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {isUserLoggedIn} from '../services/UsersService';

class DefaultAvatarDisplay extends React.PureComponent<{user: IUser}> {
    render() {
        const {user} = this.props;

        return (
            <div className="user-avatar">
                <figure
                    className={[
                        'avatar',
                        'avatar--no-margin',
                        user.picture_url ? 'no-bg' : 'initials',
                    ].join(' ')}
                >
                    {
                        user.picture_url == null
                            ? <span>{user.display_name[0].toUpperCase()}</span>
                            : <img src={user.picture_url} />
                    }
                </figure>
            </div>
        );
    }
}

interface IProps {
    user: IUser;

    // indicates whether a user is online or not
    // should only be used when the user object is up to date
    displayStatus?: boolean;
}

export class UserAvatar extends React.PureComponent<IProps> {
    render() {
        const {user, displayStatus} = this.props;

        return (
            <div
                title={user.display_name}
                style={{position: 'relative'}} // required for displaying status
                data-test-id="user-avatar"
            >
                {
                    CC.UserAvatar != null
                        ? <CC.UserAvatar user={user} />
                        : <DefaultAvatarDisplay user={user} />
                }

                {
                    displayStatus
                        ? (
                            <div
                                className={
                                    isUserLoggedIn(user)
                                        ? 'status-indicator--online'
                                        : 'status-indicator--offline'
                                }
                            />
                        )
                        : null
                }
            </div>
        );
    }
}
