import React from 'react';
import {connect} from 'react-redux';

import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {dataApi} from 'core/helpers/CrudManager';

import {IStoreState} from 'core/data';
import {IDesk, IUser, IUserRole} from 'superdesk-api';
import {UserListComponent, IUserExtra} from './UserListComponent';
import {partition} from 'lodash';

interface IProps {
    desks: Array<IDesk>;
    usersById: IStoreState['entities']['users'];
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
    usersWithRole: Array<IUserByRole>;
    usersWithoutRole: IUserByRole | undefined;
    deskMembers: {[id: string]: Array<IUser['_id']>};
}

class UsersComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        const deskMembers = {};

        Object.keys(ng.get('desks').deskMembers).forEach((deskId) => {
            deskMembers[deskId] = ng.get('desks').deskMembers[deskId].map((user) => user._id);
        });

        this.state = {
            roles: [],
            usersWithRole: [],
            deskMembers,
            usersWithoutRole: null,
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
            const [withRole, withoutRole] = partition(users._items, (item) => item.role != null);

            this.setState({
                roles: roles._items,
                usersWithRole: withRole,

                // we get the first element since users without role are always grouped in one object with `null` role
                usersWithoutRole: withoutRole[0],
            });
        });
    }

    getUsers(desk: IDesk, role: IUserRole): Array<IUserExtra> {
        const deskMembers = this.state.deskMembers[desk._id];
        const roleUsers = this.state.usersWithRole.find((item) => item.role === role._id);
        const users: Array<IUserExtra> = [];

        deskMembers.forEach((userId) => {
            const user = this.props.usersById[userId];

            if (role._id === user.role) {
                users.push({user, data: roleUsers.authors[user._id]});
            }
        });

        return users;
    }

    getUsersWithoutRole(desk: IDesk): Array<IUserExtra> | null {
        const deskMembers = this.state.deskMembers[desk._id];
        const users: Array<IUserExtra> = [];

        deskMembers.forEach((userId) => {
            const user = this.props.usersById[userId];
            const data = this.state.usersWithoutRole?.authors?.[user._id];

            if (data != null) {
                users.push({user, data});
            }
        });

        return users;
    }

    render() {
        return (
            <div className="sd-kanban-list sd-pdding-x--2 sd-padding-t--2">
                {
                    this.props.desks.map((desk) => {
                        const usersWithoutRole = this.getUsersWithoutRole(desk);

                        return (
                            <div className="sd-board" key={desk._id}>
                                <div className="sd-board__header">
                                    <h3 className="sd-board__header-title">{desk.name}</h3>
                                </div>
                                <div className="sd-board__content sd-padding-t--1">
                                    {
                                        (usersWithoutRole?.length ?? 0) > 0 && (
                                            <UserListComponent
                                                key="no-role"
                                                desk={desk}
                                                users={usersWithoutRole}
                                                onUserSelect={(user) => this.selectUser(user)}
                                            />
                                        )
                                    }
                                    {
                                        this.state.roles.map((role) => {
                                            const users = this.getUsers(desk, role);

                                            return users.length && (
                                                <UserListComponent
                                                    key={role._id}
                                                    desk={desk}
                                                    role={role}
                                                    users={users}
                                                    onUserSelect={(user) => this.selectUser(user)}
                                                />
                                            );
                                        })
                                    }
                                    {
                                        !this.state.deskMembers[desk._id].length && (
                                            <div className="sd-board__subheader">
                                                <h5 className="sd-board__subheader-title">
                                                    {gettext('There are no users assigned to this desk')}
                                                </h5>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}

const mapStateToProps = (state: IStoreState) => ({
    usersById: state.entities.users,
});

export default connect(mapStateToProps)(UsersComponent);
