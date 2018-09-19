import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc react
 * @name SlideInColumn
 * @description Vertical sliding panel component which can be used inside a column box
 */

export const SlideInColumn: React.StatelessComponent<any> = ({children}) => (
    <div className="sd-column-box__slide-in-column">
        {children}
    </div>
);

SlideInColumn.propTypes = {children: PropTypes.node};
