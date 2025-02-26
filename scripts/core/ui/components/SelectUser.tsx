/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IPropsSelectUser, IUser, IRestApiResponse, ITreeNode} from 'superdesk-api';
import {gettext, getUserSearchMongoQuery} from 'core/utils';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {Spacer, TreeSelect} from 'superdesk-ui-framework/react';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';

interface IState {
    selectedUser: IUser | null | 'loading';
    options: Array<ITreeNode<IUser>>;
    loading: boolean;
}

export class SelectUser extends SuperdeskReactComponent<IPropsSelectUser, IState> {
    constructor(props: IPropsSelectUser) {
        super(props);

        this.state = {
            selectedUser: props.selectedUserId == null ? null : 'loading',
            options: [],
            loading: true,
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

        httpRequestJsonLocal<IRestApiResponse<IUser>>({
            method: 'GET',
            path: this.props.deskId ? `/desks/${this.props.deskId}/users` : '/users',
            urlParams: {max_results: 50},
        }).then((res) => {
            this.setState({
                options: res._items.map((user) => ({value: user})),
                loading: false,
            });
        });
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

        return (
            this.state.options.length && (
                <TreeSelect
                    kind="asynchronous"
                    label={gettext('Select a user')}
                    inlineLabel={true}
                    labelHidden={true}
                    loading={this.state.loading}
                    value={this.state.selectedUser ? [this.state.selectedUser] : []}
                    getOptions={() => this.state.options}
                    searchOptions={(term, callback) => {
                        this.abortController?.abort();
                        this.abortController = new AbortController();

                        let url = '/users';

                        if (this.props.deskId != null && this.props.deskId != '') {
                            url = `/desks/${this.props.deskId}/users`;
                        }

                        const urlParams = {
                            max_results: 50,
                            where: term ? getUserSearchMongoQuery(term) : undefined,
                        };

                        httpRequestJsonLocal<IRestApiResponse<IUser>>({
                            method: 'GET',
                            path: url,
                            urlParams,
                            abortSignal: this.abortController.signal,
                        }).then((res) => {
                            const options = res._items.map((user) => ({value: user}));
                            
                            callback?.(options);
                        }).catch((err) => {
                            if (err?.name !== 'AbortError') {
                                throw err;
                            }
                        });

                        return () => {
                            this.abortController?.abort();
                        };
                    }}
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
