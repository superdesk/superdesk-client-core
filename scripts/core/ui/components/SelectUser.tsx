/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IPropsSelectUser, IUser, IRestApiResponse} from 'superdesk-api';
import {gettext, getUserSearchMongoQuery} from 'core/utils';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {SelectWithTemplate, Spacer} from 'superdesk-ui-framework/react';
import {httpRequestJsonLocal} from 'core/helpers/network';
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
        if (prevProps.deskId !== this.props.deskId) {
            this.setState({
                selectedUser: null,
            });
        }

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
                label={gettext('Select a user')}
                inlineLabel={true}
                labelHidden={true}
                getItems={(searchString) => {
                    this.abortController?.abort();
                    this.abortController = new AbortController();

                    let query = {$and: []};
                    const desk = sdApi.desks.getDeskById(this.props.deskId);
                    const deskMemberIds = (desk?.members ?? []).map((member) => member.user);

                    if (this.props.deskId != null && this.props.deskId != '') {
                        query.$and.push({_id: {$in: deskMemberIds}});
                    }

                    if (searchString != null && searchString.length > 0) {
                        query.$and.push(getUserSearchMongoQuery(searchString));
                    }

                    const urlParams = {max_results: 50};

                    if (query.$and.length > 0) {
                        urlParams['where'] = query;
                    }

                    // Wrapping into additional promise in order to avoid having to handle rejected promise
                    // in `SelectWithTemplate` component. The component takes a generic promise
                    // as an argument and not a fetch result so it wouldn't be good to handle
                    // fetch-specific rejections there.
                    return new Promise((resolve) => {
                        httpRequestJsonLocal<IRestApiResponse<IUser>>({
                            method: 'GET',
                            path: '/users',
                            urlParams,
                            abortSignal: this.abortController.signal,
                        }).then((res) => {
                            resolve(res._items);
                        }).catch((err) => {
                            // If user types something in the filter input all unfinished requests will be aborted.
                            // This is expected behaviour here and should not throw an error.
                            if (err?.name !== 'AbortError') {
                                throw err;
                            }
                        });
                    });
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
