import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Footer
 * @description Footer Component of a side panel
 */
export const Footer = ({children, className}) => (
    <div className={classNames(
        'side-panel__footer',
        className
    )}>
        {children}
    </div>
);

Footer.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

Footer.defaultProps = {
    className: '',
};