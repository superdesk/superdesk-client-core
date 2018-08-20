import React from 'react';
import PropTypes from 'prop-types';

export const signal:React.StatelessComponent<any> = (props) => {
    if (props.item.signal) {
        return React.createElement('span', {className: 'signal', key: 'signal'}, props.item.signal);
    }
};

signal.propTypes = {
    item: PropTypes.any,
};
