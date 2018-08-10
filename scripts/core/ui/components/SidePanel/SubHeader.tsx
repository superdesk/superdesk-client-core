import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name SubHeader
 * @description SubHeader of a side panel
 */
export const SubHeader = ({children, className}) => (
    <div className={classNames(
        'side-panel__header',
        className
    )}>
        {children}
    </div>
);

SubHeader.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

SubHeader.defaultProps = {
    className: '',
};