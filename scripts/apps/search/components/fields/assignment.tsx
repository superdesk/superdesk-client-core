import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

export const assignment: React.StatelessComponent<IPropsItemListInfo> = ({item}) => {
    if (item.assignment_id == null) {
        return null;
    }

    return (
        <span key="assignment"
            className="assignment-icon"
            title={gettext('Coverage')}>
            <i className="icon-calendar" />
        </span>
    );
};
