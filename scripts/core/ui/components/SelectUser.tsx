/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IPropsSelectUser, IUser} from 'superdesk-api';
import {gettext} from 'core/utils';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {Spacer, TreeSelect} from 'superdesk-ui-framework/react';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {store} from 'core/data';
import ng from 'core/services/ng';

interface IState {
    selectedUser: IUser | null;
}

export class SelectUser extends SuperdeskReactComponent<IPropsSelectUser, IState> {
    static getDerivedStateFromProps(props: IPropsSelectUser, state: IState): Partial<IState> | null {
        if (props.selectedUserId !== state.selectedUser?._id) {
            const users = store.getState().entities.users;

            return {
                selectedUser: props.selectedUserId == null ? null : users[props.selectedUserId] ?? null,
            };
        }
        return null;
    }

    constructor(props: IPropsSelectUser) {
        super(props);
        const users = store.getState().entities.users;

        this.state = {
            selectedUser: props.selectedUserId == null ? null : users[props.selectedUserId] ?? null,
        };
    }

    render() {
        const users = store.getState().entities.users;

        let options = Object.values(users);

        if (this.props.deskId != null && this.props.deskId !== '') {
            const deskMembers = ng.get('desks').deskMembers[this.props.deskId] ?? [];

            options = options.filter((user) => deskMembers.some((member) => member._id === user._id));
        }

        return (
            options.length && (
                <TreeSelect
                    kind="synchronous"
                    label={gettext('Select a user')}
                    inlineLabel={true}
                    labelHidden={true}
                    value={this.state.selectedUser ? [this.state.selectedUser] : []}
                    getOptions={() => options.map((user) => ({value: user}))}
                    onChange={(users) => {
                        const user = users[0] ?? null;

                        this.setState({selectedUser: user});
                        this.props.onSelect(user);
                    }}
                    getLabel={(user) => user.display_name}
                    getId={(user) => user._id}
                    optionTemplate={(user) => (
                        <Spacer h gap="8" noWrap justifyContent="start">
                            <div>
                                <UserAvatar user={user} displayStatus={true} />
                            </div>

                            <Spacer v gap="4" noWrap>
                                <div>{user.display_name}</div>
                                <div style={{fontSize: '1.2rem'}}>@{user.username}</div>
                            </Spacer>
                        </Spacer>
                    )}
                    valueTemplate={(user, Wrapper) => (
                        this.props.valueTemplate != null
                            ? this.props.valueTemplate(user, Wrapper)
                            : (
                                <Wrapper>
                                    <Spacer h gap="8" justifyContent="start" noGrow>
                                        <UserAvatar user={user} displayStatus={true} />
                                        {user.display_name}
                                    </Spacer>
                                </Wrapper>
                            )
                    )}
                    placeholder={gettext('Select a user')}
                    searchPlaceholder={gettext('Search...')}
                    noResultsFoundMessage={gettext('No results found.')}
                    data-test-id="select-user-dropdown"
                />
            )
        );
    }
}
