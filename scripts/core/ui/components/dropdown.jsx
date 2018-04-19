
import React from 'react';
import PropTypes from 'prop-types';

export function Dropdown(props) {
    const className = props.open ? 'dropdown open ' + props.className : 'dropdown ' + props.className;

    return (
        <div className={className}>
            <div className="dropdown__menu dropdown__menu--scrollable">{props.children}</div>
        </div>
    );
}

Dropdown.propTypes = {
    open: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
};
