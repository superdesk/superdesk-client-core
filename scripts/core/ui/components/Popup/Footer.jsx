import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Footer
 * @description Footer Component of a popup
 */
const Footer = ({children, className, noBorder, noPadding}) => (
    <div className={classNames(
        'popup__menu-footer',
        {
            'popup__menu-footer--no-border': noBorder,
            'popup__menu-footer--no-padding': noPadding,
        },
        className
    )}>
        {children}
    </div>
);

Footer.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    noBorder: PropTypes.bool,
    noPadding: PropTypes.bool,
};

export default Footer;
