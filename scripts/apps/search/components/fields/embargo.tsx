import React from 'react';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

class EmbargoComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const props = this.props;

        if (props.item.embargo == null) {
            return null;
        }

        return React.createElement(
            'span',
            {className: 'state-label state_embargo', title: gettext('embargo'), key: 'embargo'},
            gettext('embargo'),
        );
    }
}

export const embargo = EmbargoComponent;
