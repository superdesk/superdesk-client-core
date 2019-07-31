import React from 'react';
import PropTypes from 'prop-types';
import {IPropsItemListInfo} from '../ListItemInfo';

export const broadcast: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    const _broadcast = props.item.broadcast || {};

    if (_broadcast.status == null) {
        return null;
    }

    return React.createElement(
        'span',
        {className: 'broadcast-status', title: _broadcast.status, key: 'broadcast'},
        '!',
    );
};

broadcast.propTypes = {
    item: PropTypes.any,
};
