import React from 'react';
import classNames from 'classnames';

import {UserAvatar} from 'apps/users/components/UserAvatar';
import {IDesk, IUserRole, IUser} from 'superdesk-api';
import {gettext} from 'core/utils';

export interface IUserExtra {
    user: IUser;
    data: {
        assigned: number;
        locked: number;
    };
}

interface IProps {
    desk: IDesk;
    role?: IUserRole;
    users: Array<IUserExtra>;
    onUserSelect(user: IUser): void;
}

export class UserListComponent extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);

        this.selectUser.bind(this);
    }

    selectUser(user: IUserExtra) {
        this.props.onUserSelect(user.user);
    }

    render() {
        if (this.props.users == null) {
            return null;
        }

        return (
            <>
                <div className="sd-board__subheader">
                    <h5 className="sd-board__subheader-title">{this.props.role?.name ?? gettext('No role')}</h5>
                </div>
                <ul className="sd-list-item-group sd-shadow--z2">
                    {this.props.users.map((user, index) => (
                        <li className="sd-list-item" key={index} onClick={() => this.selectUser(user)}>
                            <div className="sd-list-item__border" />
                            <div
                                className={classNames(
                                    'sd-list-item__column',
                                    'sd-list-item__column--no-border',
                                    'sd-padding-x--0-5',
                                )}
                            >
                                <UserAvatar user={user.user} displayStatus={true} />
                            </div>
                            <div
                                className={classNames(
                                    'sd-list-item__column',
                                    'sd-list-item__column--grow',
                                    'sd-list-item__column--no-border,',
                                )}
                            >
                                <div className="sd-list-item__row">
                                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                        {user.user.display_name}
                                    </span>
                                    {
                                        (user.data?.locked ?? 0) > 0 && (
                                            <span className="sd-text-icon sd-text-icon--aligned-r user-items--locked">
                                                <i className="icon-lock" />{user.data.locked}
                                            </span>
                                        )
                                    }
                                    {
                                        (user.data?.assigned ?? 0) > 0 && (
                                            <span className="sd-text-icon sd-text-icon--aligned-r user-items--assigned">
                                                <i className="icon-pick" />{user.data.assigned}
                                            </span>
                                        )
                                    }
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </>
        );
    }
}
