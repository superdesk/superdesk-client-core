import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * @ngdoc react
 * @name MainColumn
 * @description Main panel component of column box
 */

export const MainColumn = ({children, padded}) => (
    <div className={classNames(
        'sd-column-box__main-column',
        {'sd-column-box__main-column--padded': padded}
    )} >
        {children}
    </div>
);

MainColumn.propTypes = {
    children: PropTypes.node,
    padded: PropTypes.bool,
};
