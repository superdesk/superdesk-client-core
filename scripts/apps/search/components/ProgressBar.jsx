import React from 'react';
import PropTypes from 'prop-types';

export function ProgressBar(props) {
    return React.createElement('div', {
        className: 'archiving-progress',
        style: {width: props.completed + '%'}
    });
}

ProgressBar.propTypes = {
    completed: PropTypes.any
};
