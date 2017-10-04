import React from 'react';
import PropTypes from 'prop-types';

export function broadcast(props) {
    var broadcast = props.item.broadcast || {};

    if (broadcast.status) {
        return React.createElement(
            'span',
            {className: 'broadcast-status', title: broadcast.status, key: 'broadcast'},
            '!'
        );
    }
}

broadcast.propTypes = {
    item: PropTypes.any,
};
