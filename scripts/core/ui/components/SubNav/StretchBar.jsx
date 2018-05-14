import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name StretchBar
 * @description Stretch Bar of a Sub Nav bar
 */
export const StretchBar = ({children, className, right}) => (
    <div
        className={classNames(
            'subnav__stretch-bar',
            {'subnav__stretch-bar--right': right},
            className
        )}
    >
        {children}
    </div>
);

StretchBar.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    right: PropTypes.bool,
};

StretchBar.defaultProps = {
    right: false,
};
