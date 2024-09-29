/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IPropsSelectUser, IUser} from 'superdesk-api';
import {gettext, searchUsers} from 'core/utils';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {SelectWithTemplate, Spacer} from 'superdesk-ui-framework/react';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {sdApi} from 'api';

interface IState {
    selectedUser: IUser | null | 'loading';
}

const itemTemplate = (props: {option: IUser}) => {
    const user: IUser | null = props.option;

    return user == null
        ? (
            <div>
                {gettext('Select a user')}
            </div>
        )
        : (
            <Spacer h gap="8" noWrap justifyContent="start">
                <div>
                    <UserAvatar user={user} displayStatus={true} />
                </div>

                <Spacer v gap="4" noWrap>
                    <div>{user.display_name}</div>
                    <div style={{fontSize: '1.2rem'}}>@{user.username}</div>
                </Spacer>

            </Spacer>
        );
};

const valueTemplateDefault = (props: {option: IUser}) => {
    const user: IUser | null = props.option;

    return user == null
        ? (
            <div>
                {gettext('Select a user')}
            </div>
        )
        : (
            <Spacer h gap="8" justifyContent="start" noGrow>
                <UserAvatar user={user} displayStatus={true} />

                {user.display_name}
            </Spacer>
        );
};

export class SelectUser extends SuperdeskReactComponent<IPropsSelectUser, IState> {
    constructor(props: IPropsSelectUser) {
        super(props);

        this.state = {
            selectedUser: props.selectedUserId == null ? null : 'loading',
        };

        this.abortController = null;
    }

    componentDidMount() {
        if (this.props.selectedUserId != null) {
            this.asyncHelpers.httpRequestJsonLocal<IUser>({
                method: 'GET',
                path: `/users/${this.props.selectedUserId}`,
            }).then((selectedUser) => {
                this.setState({selectedUser});
            });
        }
    }

    componentWillUnmount() {
        this.abortController?.abort();
    }

    componentDidUpdate(prevProps: IPropsSelectUser) {
        if (prevProps.selectedUserId !== this.props.selectedUserId) {
            // state.user needs to be updated if props.selectedUserId changes
            if (this.props.selectedUserId == null) {
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({selectedUser: null});
            } else if (
                this.state.selectedUser === 'loading'
                || this.state.selectedUser?._id !== this.props.selectedUserId
            ) {
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({selectedUser: 'loading'});

                this.asyncHelpers.httpRequestJsonLocal<IUser>({
                    method: 'GET',
                    path: `/users/${this.props.selectedUserId}`,
                }).then((selectedUser) => {
                    // eslint-disable-next-line react/no-did-update-set-state
                    this.setState({selectedUser});
                });
            }
        }
    }

    render() {
        if (this.state.selectedUser === 'loading') {
            return null;
        }

        const valueTemplate = this.props.valueTemplate != null ? this.props.valueTemplate : valueTemplateDefault;

        return (
            <SelectWithTemplate
                key={this.props.deskId}
                label={gettext('Select a user')}
                inlineLabel={true}
                labelHidden={true}
                getItems={(searchString) => {
                    const deskMembers = sdApi.desks.getDeskMembers(this.props.deskId);

                    return Promise.resolve(searchUsers(deskMembers, searchString));
                }}
                value={this.state.selectedUser}
                onChange={(user) => {
                    this.setState({selectedUser: user});
                    this.props.onSelect(user);
                }}
                getLabel={(option) => option.display_name}
                itemTemplate={itemTemplate}
                valueTemplate={valueTemplate}
                areEqual={(a, b) => a._id === b._id}
                autoFocus={this.props.autoFocus}
                autoOpen={this.state.selectedUser == null}
                width="100%"
                zIndex={1050}
                noResultsFoundMessage={gettext('No results found.')}
                filterPlaceholder={gettext('Search...')}
                data-test-id="select-user-dropdown"
                required={!(this.props.clearable ?? true)}
            />
        );
    }
}
