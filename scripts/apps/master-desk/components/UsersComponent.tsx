import React from 'react';
import {gettext} from 'core/utils';

import {dataApi} from 'core/helpers/CrudManager';

import {UserListComponent} from './UserListComponent';
import {IDesk, IUserRole, IUser} from 'superdesk-api';

interface IProps {
    desks: Array<IDesk>;
    deskService: any;
    apiService: any;
    onUserSelect(user: IUser): void;
}

interface IState {
    roles: Array<IUserRole>;
    users: any;
}

export class UsersComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            roles: [],
            users: [],
        };

        this.selectUser.bind(this);
    }

    selectUser(user: IUser) {
        this.props.onUserSelect(user);
    }

    componentDidMount() {
        const api = this.props.apiService;

        api('roles').query().then((result) => {
            this.setState({roles: result._items});
        });

        dataApi.query('desks/all/overview/users', 1, {field: null, direction: 'ascending'}, {})
            .then((res) => this.setState({users: res._items}));
    }

    getUsers(desk: IDesk, role: IUserRole): Array<any> {
        const deskMembers = this.props.deskService.deskMembers[desk._id];
        const authors = this.state.users.find((item) => item.role === role._id);

        let users: Array<any> = [];

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
                {this.props.desks.map((desk, index) => (
                    <div className="sd-board" key={index}>
                        <div className="sd-board__header">
                            <h3 className="sd-board__header-title">{desk.name}</h3>
                        </div>
                        <div className="sd-board__content sd-padding-t--1">
                            {this.state.roles.map((role, i) => (
                                this.getUsers(desk, role).length ? (
                                    <UserListComponent
                                        key={i}
                                        desk={desk}
                                        role={role}
                                        users={this.getUsers(desk, role)}
                                        onUserSelect={(user) => this.selectUser(user)}
                                    />
                                ) : null
                            ))}

                            {!this.props.deskService.deskMembers[desk._id].length ? (
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
