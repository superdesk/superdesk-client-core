import React from 'react';
import {IConfigurableUiComponents, IUser} from 'superdesk-api';
import {UserAvatar} from 'apps/users/components';

class UserAvatarDefault extends React.Component<{user: IUser}> {
    render() {
        return <UserAvatar displayName={this.props.user.display_name} pictureUrl={this.props.user.picture_url} />;
    }
}

// CC stands for configurable components
// components may be overwritten after application start
export const CC: IConfigurableUiComponents = {
    UserAvatar: UserAvatarDefault,
};
