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
    loading: boolean;
}

export class SelectUser extends React.Component<IPropsSelectUser, IState> {
    constructor(props: IPropsSelectUser) {
        super(props);

        this.state = {
            loading: false,
        };

        this.queryUsers = this.queryUsers.bind(this);
    }

    queryUsers(_searchString: string = '') {
        const searchString = _searchString.trim();

        this.setState({loading: true, fetchedUsers: null});

        dataApi.query<IUser>(
            'users',
            1,
            {field: 'display_name', direction: 'ascending'},
            (
                searchString.length > 0
                    ? {
                        $or: [
                            {
                                display_name: {
                                    $regex: searchString,
                                    $options: '-i',
                                },
                            },
                            {
                                username: {
                                    $regex: searchString,
                                    $options: '-i',
                                },
                            },
                        ],
                    }
                    : {}
            ),
            50,
        )
            .then((res) => {
                this.setState({
                    fetchedUsers: res._items,
                    loading: false,
                });
            });
    }

    componentDidMount() {
        this.queryUsers();
    }

    render() {
        const keyedUsers = keyBy(this.state.fetchedUsers, (user) => user._id);

        return (
            <Select2
                disabled={this.props.disabled}
                placeholder={gettext('Select a user')}
                value={this.props.selectedUserId == null ? undefined : this.props.selectedUserId}
                items={keyedUsers}
                getItemValue={(user) => user._id}
                getItemLabel={(user) => user.display_name}
                onSelect={(value) => {
                    this.props.onSelect(keyedUsers[value]);
                }}
                renderItem={(user) => (
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <UserAvatar displayName={user.display_name} pictureUrl={user.picture_url} />
                        <div style={{paddingLeft: '0.5em'}}>{user.display_name}</div>
                    </div>
                )}
                data-test-id="select-user-dropdown"
                onSearch={(search) => {
                    this.queryUsers(search);
                }}
                loading={this.state.loading}
            />
        );
    }
}
