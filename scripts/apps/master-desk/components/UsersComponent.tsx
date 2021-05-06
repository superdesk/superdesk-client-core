import React from 'react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';

import {dataApi} from 'core/helpers/CrudManager';
import {addWebsocketEventListener} from 'core/notification/notification';

import {UserListComponent, IUserExtra} from './UserListComponent';
import {IDesk, IResourceUpdateEvent, IUser, IUserRole, IWebsocketMessage} from 'superdesk-api';

interface IProps {
    desks: Array<IDesk>;
    onUserSelect(user: IUser): void;
}

interface IUserByRole {
    role?: IUserRole['_id'];
    authors: {[userId: string]: {
        assigned: number;
        locked: number;
    }};
}

interface IState {
    roles: Array<IUserRole>;
    usersByRole: Array<IUserByRole>;
    deskMembers: {[id: string]: Array<IUser>};
}

export class UsersComponent extends React.Component<IProps, IState> {
    eventListeners: Array<CallableFunction> = [];

    constructor(props: IProps) {
        super(props);

        this.state = {
            roles: [],
            usersByRole: [],
            deskMembers: ng.get('desks').deskMembers,
        };

        this.selectUser.bind(this);
    }

    selectUser(user: IUser) {
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
                usersByRole: users._items,
            });
        });

        this.eventListeners.push(
            addWebsocketEventListener(
                'resource:updated',
                (event: IWebsocketMessage<IResourceUpdateEvent>) => {
                    const {resource, fields, _id} = event.extra;

                    if (resource === 'users' && fields.last_activity_at) {
                        this.reloadUser(_id);
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

    getUsers(desk: IDesk, role: IUserRole): Array<IUserExtra> {
        const deskMembers = this.state.deskMembers[desk._id];
        const roleUsers = this.state.usersByRole.find((item) => item.role === role._id);
        const users: Array<IUserExtra> = [];

        deskMembers.forEach((user) => {
            if (role._id === user.role) {
                users.push({user, data: roleUsers.authors[user._id]});
            }
        });

        return users;
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
