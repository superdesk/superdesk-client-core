import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Header
 * @description Header Component of a list
 */
export const Header = ({children, title, marginTop}) => (
    <div className={classNames('sd-list-header', {'sd-list-header--m-top': marginTop})}>
        {title && <span className="sd-list-header__name">{title}</span>}
        {children}
    </div>
);

Header.propTypes = {
    title: PropTypes.string,
    marginTop: PropTypes.bool,
    children: PropTypes.node,
};
