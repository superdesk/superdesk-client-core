import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';


export const Row = ({children, flex, noPadding, halfWidth, className}) => (
    <div className={classNames(
        'form__row',
        {
            'form__row--flex': flex,
            'form__row--no-padding': noPadding,
            'form__row--half-width': halfWidth,
        },
        className
    )}>
        {children}
    </div>
);

Row.propTypes = {
    children: PropTypes.node,
    flex: PropTypes.bool,
    noPadding: PropTypes.bool,
    className: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    halfWidth: PropTypes.bool,
};

Row.defaultProps = {
    flex: false,
    noPadding: false,
};