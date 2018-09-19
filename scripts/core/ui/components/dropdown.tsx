
import React from 'react';
import PropTypes from 'prop-types';

export const Dropdown: React.StatelessComponent<any> = (props) => {
    const className = props.open ? 'dropdown open ' + props.className : 'dropdown ' + props.className;

    const childClassNames = ['dropdown__menu'];

    if (props.scrollable !== false) {
        childClassNames.push('dropdown__menu--scrollable');
    }

    return (
        <div className={className}>
            <div className={childClassNames.join(' ')}>{props.children}</div>
        </div>
    );
};

Dropdown.propTypes = {
    open: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    scrollable: PropTypes.bool,
};
