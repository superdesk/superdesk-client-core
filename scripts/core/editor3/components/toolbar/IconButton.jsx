import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name IconButton
 * @description IconButton displays a button with an icon on the toolbar.
 */
export const IconButton = ({onClick, iconName, tooltip}) =>
    <div data-flow={'down'} data-sd-tooltip={tooltip} className="Editor3-styleButton">
        <span onClick={onClick}><i className={`icon-${iconName}`} /></span>
    </div>;

IconButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    tooltip: PropTypes.string,
    iconName: PropTypes.string.isRequired,
};
