import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

export const updated: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    const openItem = function(event) {
        event.stopPropagation();
        props.openAuthoringView(props.item.rewritten_by);
    };

    if (props.item.rewritten_by) {
        return React.createElement(
            'div',
            {className: 'state-label updated', key: 'updated', onClick: openItem},
            gettext('Updated'),
        );
    } else {
        return null;
    }
};

updated.propTypes = {
    item: PropTypes.any,
    openAuthoringView: PropTypes.func,
};
