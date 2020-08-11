import React from 'react';
import {IPropsSelectUser, IUser} from 'superdesk-api';
import {Select2} from './select2';
import {keyBy} from 'lodash';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {ListItem, ListItemColumn, ListItemRow} from 'core/components/ListItem';
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

        return dataApi.query<IUser>(
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
                autoFocus={this.props.autoFocus ?? true}
                disabled={this.props.disabled}
                placeholder={
                    <ListItem fullWidth noBackground noShadow>
                        <ListItemColumn ellipsisAndGrow>
                            <ListItemRow>{gettext('Select a user')}</ListItemRow>
                        </ListItemColumn>
                    </ListItem>
                }
                value={this.props.selectedUserId == null ? undefined : this.props.selectedUserId}
                items={keyedUsers}
                getItemValue={(user) => user._id}
                onSelect={(value) => {
                    this.props.onSelect(keyedUsers[value]);
                }}
                renderItem={(user) => (
                    <ListItem fullWidth noBackground noShadow>
                        <ListItemColumn noBorder>
                            <UserAvatar user={user} displayStatus={true} />
                        </ListItemColumn>

                        <ListItemColumn ellipsisAndGrow>
                            <ListItemRow>{user.display_name}</ListItemRow>
                            <ListItemRow>@{user.username}</ListItemRow>
                        </ListItemColumn>
                    </ListItem>
                )}
                data-test-id="select-user-dropdown"
                onSearch={(search) => this.queryUsers(search)}
                loading={this.state.loading}
                horizontalSpacing={this.props.horizontalSpacing}
                required
            />
        );
    }
}
