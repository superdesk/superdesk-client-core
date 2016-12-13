import React from 'react';

export function signal(props) {
    if (props.item.signal) {
        return React.createElement('span', {className: 'signal', key: 'signal'}, props.item.signal);
    }
}

signal.propTypes = {
    item: React.PropTypes.any,
};
