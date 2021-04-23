import React from 'react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';

import {dataApi} from 'core/helpers/CrudManager';
import {addWebsocketEventListener} from 'core/notification/notification';

import {UserListComponent, IUserExtra} from './UserListComponent';
import {IDesk, IResourceUpdateEvent, IUserRole, IWebsocketMessage} from 'superdesk-api';

interface IProps {
    desks: Array<IDesk>;
    onUserSelect(user: IUserExtra): void;
}

interface IState {
    roles: Array<IUserRole>;
    users: Array<IUserExtra>;
    deskMembers: {[id: string]: Array<IUserExtra>};
}

export class UsersComponent extends React.Component<IProps, IState> {
    services: any;
    eventListeners: Array<any> = [];

    constructor(props: IProps) {
        super(props);

        this.state = {
            roles: [],
            users: [],
            deskMembers: ng.get('desks').deskMembers,
        };

        this.selectUser.bind(this);
    }

    selectUser(user: IUserExtra) {
        this.props.onUserSelect(user);
    }

    componentDidMount() {
        Promise.all([
            dataApi.query('roles', 1, {field: null, direction: 'ascending'}, {}),
            dataApi.query('desks/all/overview/users', 1, {field: null, direction: 'ascending'}, {}),
        ]).then((res: any) => {
            const [roles, users] = res;

            this.setState({
                roles: roles._items,
                users: users._items,
            });
        });

        this.eventListeners.push(
            addWebsocketEventListener(
                'resource:updated',
                (event: IWebsocketMessage<IResourceUpdateEvent>) => {
                    const {resource, fields, _id} = event.extra;

                    if (resource === 'users' && fields.last_activity_at) {
                        if (Object.values(this.state.deskMembers).some(
                            (users) => users.find((user) => user._id === _id),
                        )) {
                            this.reloadUser(_id);
                        }
                    }
                },
            ),
        );
    }

    componentWillUnmount() {
        this.eventListeners.forEach((remove) => remove());
    }

    reloadUser(id) {
        dataApi.findOne('users', id).then((updatedUser) => {
            const deskMembers = {};

            Object.keys(this.state.deskMembers).forEach((deskId) => {
                deskMembers[deskId] = this.state.deskMembers[deskId].map(
                    (user) => user._id === id ? updatedUser : user,
                );
            });

            this.setState({deskMembers});
        });
    }

    getUsers(desk: IDesk, role: IUserRole): Array<any> {
        const deskMembers = this.state.deskMembers[desk._id];
        const authors = this.state.users.find((item) => item.role === role._id);

        let users: Array<IUserExtra> = [];

        deskMembers.forEach((user) => {
            if (role._id === user.role) {
                user.data = authors.authors[user._id];
                users.push(user);
            }
        });

        return users ? users : [];
    }

    render() {
        return (
            <div className="sd-kanban-list sd-pdding-x--2 sd-padding-t--2">
                {this.props.desks.map((desk) => (
                    <div className="sd-board" key={desk._id}>
                        <div className="sd-board__header">
                            <h3 className="sd-board__header-title">{desk.name}</h3>
                        </div>
                        <div className="sd-board__content sd-padding-t--1">
                            {this.state.roles.map((role) => (
                                this.getUsers(desk, role).length ? (
                                    <UserListComponent
                                        key={role._id}
                                        desk={desk}
                                        role={role}
                                        users={this.getUsers(desk, role)}
                                        onUserSelect={(user) => this.selectUser(user)}
                                    />
                                ) : null
                            ))}

                            {!this.state.deskMembers[desk._id].length ? (
                                <div className="sd-board__subheader">
                                    <h5 className="sd-board__subheader-title">
                                        {gettext('There are no users assigned to this desk')}
                                    </h5>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ),
                )}
            </div>
        );
    }
}
