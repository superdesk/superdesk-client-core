import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Content
 * @description Component to hold contents of a popup
 */
const Content = ({children, className, noPadding}) => (
    <div className={classNames(
        'popup__menu-content',
        {'popup__menu-content--no-padding': noPadding},
        className
    )}>
        {children}
    </div>
);

Content.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    noPadding: PropTypes.bool,
};

Content.defaultProps = {noPadding: false};

export default Content;
