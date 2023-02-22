import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name SubHeader
 * @description SubHeader of a side panel
 */
export const SubHeader: React.StatelessComponent<any> = ({children, className}) => (
    <div
        className={classNames(
            'side-panel__header side-panel__header--border-b',
            className,
        )}
    >
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
