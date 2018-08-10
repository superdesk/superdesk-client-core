import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc react
 * @name Panel
 * @description Main panel of a slide-in panel
 */
export const Panel:React.StatelessComponent<any> = ({children}) => (
    <div className="sd-column-box__slide-in-column-inner sd-slide-in-panel">
        {children}
    </div>
);

Panel.propTypes = {children: PropTypes.node};
