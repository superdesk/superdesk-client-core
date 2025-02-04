import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Label
 * @description Label styling for dropdown optins
 */

export const Label: React.StatelessComponent<any> = ({children, className}) => (
    <li
        className={classNames(
            'dropdown__menu-label',
            className,
        )}
    >
        {children}
    </li>
);

Label.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};
