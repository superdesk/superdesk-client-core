import React from 'react';
import PropTypes from 'prop-types';
import {IAuthoringSectionTheme} from 'apps/authoring-react/authoring-section/authoring-section';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name IconButton
 * @description IconButton displays a button with an icon on the toolbar.
 */

interface IProps {
    onClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void;
    tooltip: string;
    iconName: string;
    uiTheme: IAuthoringSectionTheme;
}

export const IconButton: React.FunctionComponent<IProps> = ({onClick, iconName, tooltip, uiTheme}) => (
    <div
        data-flow={'down'}
        data-sd-tooltip={tooltip}
        className="Editor3-styleButton"
        style={{color: uiTheme.textColor}}
    >
        <span onClick={onClick}><i className={`icon-${iconName}`} /></span>
    </div>
);
