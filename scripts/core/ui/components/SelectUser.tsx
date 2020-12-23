import React from 'react';
import {IPropsSelectUser, IUser} from 'superdesk-api';
import {gettext} from 'core/utils';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {SelectWithTemplate} from 'superdesk-ui-framework/react';
import {dataApi} from 'core/helpers/CrudManager';
import {appConfig} from 'appConfig';
import ng from 'core/services/ng';

interface IState {
    selectedUser: IUser | null | 'loading';
}

export class SelectUser extends React.Component<IPropsSelectUser, IState> {
    _mounted: boolean;
    abortController: AbortController | null;

    constructor(props: IPropsSelectUser) {
        super(props);

        this.state = {
            selectedUser: props.selectedUserId == null ? null : 'loading',
        };

        this._mounted = false;
        this.abortController = null;
    }

    componentDidMount() {
        this._mounted = true;

        if (this.props.selectedUserId != null) {
            dataApi.findOne<IUser>('users', this.props.selectedUserId).then((selectedUser) => {
                this.setState({selectedUser});
            });
        }
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    componentDidUpdate(prevProps: IPropsSelectUser) {
        if (prevProps.selectedUserId !== this.props.selectedUserId && this.props.selectedUserId != null) {
            dataApi.findOne<IUser>('users', this.props.selectedUserId).then((selectedUser) => {
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
                getItems={(searchString) => {
                    this.abortController?.abort();
                    this.abortController = new AbortController();

                    const query = JSON.stringify(
                        searchString != null && searchString.length > 0
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
                            : {},
                    );

                    return new Promise((resolve) => {
                        fetch(`${appConfig.server.url}/users?where=${query}&max_results=50`, {
                            signal: this.abortController.signal,
                            method: 'GET',
                            headers: {
                                'Authorization': ng.get('session').token,
                            },
                            mode: 'cors',
                        })
                            .then((res) => res.json())
                            .then((res) => {
                                resolve(res._items);
                            })
                            .catch((err) => {
                                if (err?.name !== 'AbortError') {
                                    throw err;
                                }
                            });
                    });
                }}
                value={this.state.selectedUser}
                onChange={(user) => {
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
                                        <div style={{fontSize: 12}}>@{user.username}</div>
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
