
import React from 'react';
import PropTypes from 'prop-types';

export function Dropdown(props) {
    const className = props.open ? 'dropdown open' : 'dropdown';

    return (
        <div className={className}>
            <div className="dropdown__menu">{props.children}</div>
        </div>
    );
}

Dropdown.propTypes = {
    open: PropTypes.bool,
    children: PropTypes.node
};
