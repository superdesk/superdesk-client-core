import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name ButtonStack
 * @description Stack of buttons of a Sub Nav bar
 */
export const ButtonStack:React.StatelessComponent<any> = ({children, right, padded, className}) => (
    <div className={classNames(
        'subnav__button-stack',
        {
            'subnav__button-stack--right': right,
            'subnav__button-stack--padded': padded,
        },
        className
    )}>
        {children}
    </div>
);

ButtonStack.propTypes = {
    children: PropTypes.node,
    right: PropTypes.bool,
    padded: PropTypes.bool,
    className: PropTypes.string,
};

ButtonStack.defaultProps = {
    right: false,
    padded: false,
};
