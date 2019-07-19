import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

export const embargo: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    if (props.item.embargo == null) {
        return null;
    }

    return React.createElement(
        'span',
        {className: 'state-label state_embargo', title: gettext('embargo'), key: 'embargo'},
        gettext('embargo'),
    );
};

embargo.propTypes = {
    item: PropTypes.any,
};
