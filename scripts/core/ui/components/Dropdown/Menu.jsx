import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Menu
 * @description Menu container of dropdown component
 */

export const Menu = ({children, className, isOpen, alignRight, scrollable}) => (
    !isOpen ? null :
        <ul
            className={classNames(
                'dropdown__menu',
                {
                    'dropdown--align-right': alignRight,
                    'dropdown__menu--scrollable': scrollable,
                },
                className
            )}
        >
            {children}
        </ul>
);

Menu.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    isOpen: PropTypes.bool,
    alignRight: PropTypes.bool,
    scrollable: PropTypes.bool,
};

Menu.defaultProps = {
    isOpen: false,
    alignRight: false,
    scrollable: false,
};
