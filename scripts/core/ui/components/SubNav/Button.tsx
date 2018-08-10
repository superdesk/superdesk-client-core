import React from 'react';
import PropTypes from 'prop-types';

import {ButtonStack} from './ButtonStack';

/**
 * @ngdoc react
 * @name Button
 * @description Button of a Sub Nav bar
 */
export const Button:React.StatelessComponent<any> = ({children, className, right, buttonClassName, onClick, padded}) => (
    <ButtonStack
        right={right}
        padded={padded}
        className={className}
    >
        <button className={buttonClassName} onClick={onClick}>
            {children}
        </button>
    </ButtonStack>
);

Button.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    right: PropTypes.bool,
    buttonClassName: PropTypes.string,
    onClick: PropTypes.func,
    padded: PropTypes.bool,
};

Button.defaultProps = {
    right: false,
    padded: false,
};
