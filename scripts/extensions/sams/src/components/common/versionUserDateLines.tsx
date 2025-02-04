// External Modules
import * as React from 'react';

import {IUser} from 'superdesk-api';
import {superdeskApi} from '../../apis';
import {IVersionInformation} from '../../interfaces';

interface IProps {
    item: IVersionInformation;
}

interface IState {
    users: Dictionary<string, IUser>;
}

export class VersionUserDateLines extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {users: {}};
    }

    componentDidMount() {
        this.loadUsers();
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        if (this.props.item.original_creator !== prevProps.item.original_creator ||
            this.props.item.version_creator !== prevProps.item.version_creator
        ) {
            this.loadUsers();
        }
    }

    loadUsers() {
        const userIds = [
            this.props.item.original_creator,
            this.props.item.version_creator,
        ].filter(
            (user) => user != null,
        ) as Array<IUser['_id']>;

        if (userIds.length === 0) {
            return;
        }

        superdeskApi.entities.users.getUsersByIds(userIds)
            .then((users) => {
                this.setState({
                    users: users.reduce(
                        (userList, user) => {
                            userList[user._id] = user;

                            return userList;
                        },
                        {} as Dictionary<string, IUser>,
                    ),
                });
            });
    }

    render() {
        const {gettext, longFormatDateTime, getRelativeOrAbsoluteDateTime} = superdeskApi.localization;
        const {config} = superdeskApi.instance;
        const {item} = this.props;

        const createdUser: IUser | null = item.original_creator == null ?
            null :
            this.state.users[item.original_creator];

        const createdDate = getRelativeOrAbsoluteDateTime(item.firstcreated, config.view.dateformat);
        const createdDateLong = longFormatDateTime(item.firstcreated);
        const updatedUser: IUser | null = item.version_creator == null ?
            null :
            this.state.users[item.version_creator];
        const updateDate = getRelativeOrAbsoluteDateTime(item.versioncreated, config.view.dateformat);
        const updateDateLong = longFormatDateTime(item.versioncreated);

        return (
            <React.Fragment>
                <p className="sd-text__date-and-author sd-margin-b--0">
                    {createdUser == null ? (
                        <time title={createdDateLong}>
                            {gettext('Created {{ datetime }}', {datetime: createdDate})}
                        </time>
                    ) : (
                        <React.Fragment>
                            <time title={createdDateLong}>
                                {gettext('Created {{ datetime }} by ', {datetime: createdDate})}
                            </time>
                            <span className="sd-text__author">
                                {createdUser.display_name}
                            </span>
                        </React.Fragment>
                    )}
                </p>
                <p className="sd-text__date-and-author sd-margin-b--0">
                    {updatedUser == null ? (
                        <time title={updateDateLong}>
                            {gettext('Updated {{ datetime }}', {datetime: updateDate})}
                        </time>
                    ) : (
                        <React.Fragment>
                            <time title={updateDateLong}>
                                {gettext('Updated {{ datetime }} by ', {datetime: updateDate})}
                            </time>
                            <span className="sd-text__author">
                                {updatedUser.display_name}
                            </span>
                        </React.Fragment>
                    )}
                </p>
            </React.Fragment>
        );
    }
}
