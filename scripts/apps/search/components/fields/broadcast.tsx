import React from 'react';
import PropTypes from 'prop-types';

export const broadcast: React.StatelessComponent<any> = (props) => {
    const _broadcast = props.item.broadcast || {};

    if (_broadcast.status) {
        return React.createElement(
            'span',
            {className: 'broadcast-status', title: _broadcast.status, key: 'broadcast'},
            '!',
        );
    }
};

broadcast.propTypes = {
    item: PropTypes.any,
};
