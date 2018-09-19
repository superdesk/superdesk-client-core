import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name Subnav
 * @description Main Sub Nav component
 */
export const SubNav: React.StatelessComponent<any> = ({children, className, darkBlue, darker}) => (
    <div
        className={classNames(
            'subnav',
            {
                'subnav--dark-blue-grey': darkBlue,
                'subnav--darker': darker,
            },
            className,
        )}
    >
        {children}
    </div>
);

SubNav.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    darkBlue: PropTypes.bool,
    darker: PropTypes.bool,
};

SubNav.defaultProps = {
    darkBlue: false,
    darker: false,
};
