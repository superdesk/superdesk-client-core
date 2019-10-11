import React from 'react';
import {IPropsSelectUser, IUser} from 'superdesk-api';
import {Select2} from './select2';
import {keyBy} from 'lodash';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';
import {CC} from '../configurable-ui-components';

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
                getItemLabel={(user) => user.display_name}
                onSelect={(value) => {
                    this.props.onSelect(keyedUsers[value]);
                }}
                renderItem={(user) => (
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <CC.UserAvatar user={user} />
                        <div style={{paddingLeft: '0.5em'}}>{user.display_name}</div>
                    </div>
                )}
                data-test-id="select-user-dropdown"
            />
        );
    }
}
