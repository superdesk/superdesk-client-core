import React from 'react';
import PropTypes from 'prop-types';

export const ProgressBar:React.StatelessComponent<any> = (props) => React.createElement('div', {
    className: 'archiving-progress',
    style: {width: props.completed + '%'},
});

ProgressBar.propTypes = {
    completed: PropTypes.any,
};
