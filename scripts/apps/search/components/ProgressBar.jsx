import React from 'react';

export function ProgressBar(props) {
    return React.createElement('div', {
        className: 'archiving-progress',
        style: {width: props.completed + '%'}
    });
}

ProgressBar.propTypes = {
    completed: React.PropTypes.any
};
