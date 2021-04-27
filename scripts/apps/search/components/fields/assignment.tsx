import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

class AssignmentComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const {item} = this.props;

        if (item.assignment_id == null) {
            return null;
        }

        return (
            <span
                key="assignment"
                className="assignment-icon"
                title={gettext('Coverage')}
            >
                <i className="icon-calendar" />
            </span>
        );
    }
}

export const assignment = AssignmentComponent;
