// External Modules
import * as React from 'react';

import {IUser} from 'superdesk-api';
import {superdeskApi} from '../../apis';
import {IVersionInformation} from '../../interfaces';

interface IProps {
    item: IVersionInformation;
}

export class VersionUserDateLines extends React.Component<IProps> {
    render() {
        const users = superdeskApi.entities.users.getAllUsers();
        const {gettext, longFormatDateTime, getRelativeOrAbsoluteDateTime} = superdeskApi.localization;
        const {config} = superdeskApi.instance;
        const {item} = this.props;

        const createdUser: IUser | null = item.original_creator == null ?
            null :
            users[item.original_creator];

        const createdDate = getRelativeOrAbsoluteDateTime(item.firstcreated, config.view.dateformat);
        const createdDateLong = longFormatDateTime(item.firstcreated);
        const updatedUser: IUser | null = item.version_creator == null ?
            null :
            users[item.version_creator];
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
