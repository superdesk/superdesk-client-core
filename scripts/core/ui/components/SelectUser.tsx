import React from 'react';
import {IPropsSelectUser, IUser, IRestApiResponse} from 'superdesk-api';
import {gettext, getUserSearchMongoQuery} from 'core/utils';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {SelectWithTemplate} from 'superdesk-ui-framework/react';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';

interface IState {
    selectedUser: IUser | null | 'loading';
}

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
        // state.user needs to be updated if props.selectedUserId changes
        if (this.props.selectedUserId == null && this.state.selectedUser != null) {
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

    render() {
        if (this.state.selectedUser === 'loading') {
            return null;
        }

        return (
            <SelectWithTemplate
                inlineLabel
                labelHidden
                label={gettext('Select user')}
                getItems={(searchString) => {
                    this.abortController?.abort();
                    this.abortController = new AbortController();

                    const query = JSON.stringify(
                        searchString != null && searchString.length > 0
                            ? getUserSearchMongoQuery(searchString)
                            : {},
                    );

                    // Wrapping into additional promise in order to avoid having to handle rejected promise
                    // in `SelectWithTemplate` component. The component takes a generic promise
                    // as an argument and not a fetch result so it wouldn't be good to handle
                    // fetch-specific rejections there.
                    return new Promise((resolve) => {
                        httpRequestJsonLocal<IRestApiResponse<IUser>>({
                            method: 'GET',
                            path: '/users',
                            urlParams: {
                                where: query,
                                max_results: 50,
                            },
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
                itemTemplate={
                    (props) => {
                        const user = props.option;

                        return user == null
                            ? (
                                <div>
                                    {gettext('Select a user')}
                                </div>
                            )
                            : (
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                    <UserAvatar user={user} displayStatus={true} />
                                    <div style={{marginLeft: 14, padding: '4px 0'}}>
                                        <div>{user.display_name}</div>
                                        <div style={{fontSize: '1.2rem'}}>@{user.username}</div>
                                    </div>
                                </div>
                            );
                    }
                }
                areEqual={(a, b) => a._id === b._id}
                autoFocus={this.props.autoFocus}
                autoOpen={this.state.selectedUser == null}
                width="100%"
                zIndex={1050}
                noResultsFoundMessage={gettext('No results found.')}
                filterPlaceholder={gettext('Search...')}
                data-test-id="select-user-dropdown"
                required
            />
        );
    }
}
