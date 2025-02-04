import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc react
 * @name Box
 * @description UI component with column-box styling
 */

export const Box: React.StatelessComponent<any> = ({children}) => (
    <div className="sd-column-box--2">
        {children}
    </div>
);

Box.propTypes = {children: PropTypes.node};
