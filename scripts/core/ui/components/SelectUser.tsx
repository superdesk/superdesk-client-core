import React from 'react';
import {IPropsSelectUser, IUser} from 'superdesk-api';
import {Select2} from './select2';
import {keyBy} from 'lodash';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {UserAvatar} from 'apps/users/components/UserAvatar';

interface IState {
    fetchedUsers?: Array<IUser>;
    selectedUser?: IUser;
}

export class SelectUser extends React.Component<IPropsSelectUser, IState> {
    constructor(props: IPropsSelectUser) {
        super(props);

        this.state = {};
    }

    componentDidMount() {
        dataApi.query<IUser>('users', 1, {field: 'display_name', direction: 'ascending'}, {})
            .then((res) => {
                this.setState({
                    fetchedUsers: res._items,
                });
            });
    }

    render() {
        if (this.state.fetchedUsers == null) {
            return null;
        }

        const keyedUsers = keyBy(this.state.fetchedUsers, (user) => user._id);

        return (
            <Select2
                disabled={this.props.disabled}
                placeholder={gettext('Select a user')}
                value={this.props.selectedUserId == null ? undefined : this.props.selectedUserId}
                items={keyedUsers}
                getItemValue={(user) => user._id}
                getItemLabel={(user) => user.display_name + ' ' + user.username}
                onSelect={(value) => {
                    this.props.onSelect(keyedUsers[value]);
                }}
                renderItem={(user) => (
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <UserAvatar displayName={user.display_name} pictureUrl={user.picture_url} />
                        <div style={{paddingLeft: '0.5em', textAlign: 'left'}}>
                            <div><strong>{user.display_name}</strong></div>
                            <div
                                style={{fontSize: '11px', lineHeight: '11px', opacity: 0.5, marginTop: '-2px'}}
                            >
                                @{user.username}
                            </div>
                        </div>
                    </div>
                )}
            />
        );
    }
}
