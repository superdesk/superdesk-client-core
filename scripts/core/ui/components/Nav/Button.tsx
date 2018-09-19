import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

/**
 * @ngdoc react
 * @name Button
 * @description Button Component for a NavBar
 */
export const Button: React.StatelessComponent<any> = ({
    className,
    onClick,
    icon,
    tooltip,
    tooltipDirection,
    children,
    dropdown,
    textWithIcon,
    left,
    darker,
    active,
    ...props
}) => (
    <button
        className={classNames(
            'navbtn',
            {
                'navbtn--left': left,
                'navbtn--darker': darker,
                'navbtn--active': active,
                'navbtn--text-with-icon': textWithIcon,
                'dropdown-toggle': dropdown,
                dropdown__toggle: dropdown,
            },
            className,
        )}
        onClick={onClick || null}
        data-sd-tooltip={tooltip}
        data-flow={tooltipDirection}
        {...props}
    >
        {icon && <i className={icon} />}
        {children}
    </button>
);

Button.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.string,
    tooltip: PropTypes.string,
    tooltipDirection: PropTypes.oneOf(['top', 'down', 'left', 'right']),
    children: PropTypes.node,
    dropdown: PropTypes.bool,
    textWithIcon: PropTypes.bool,
    left: PropTypes.bool,
    darker: PropTypes.bool,
    active: PropTypes.bool,
};

Button.defaultProps = {
    tooltipDirection: 'top',
    dropdown: false,
    textWithIcon: false,
    left: false,
    darker: false,
    active: false,
};
