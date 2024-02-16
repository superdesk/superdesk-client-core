import React from 'react';
import {IEditorComponentProps} from 'superdesk-api';

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

    // nullable since not present in angularjs based authoring
    uiTheme?: IEditorComponentProps<unknown, unknown, unknown>['uiTheme'];
}

export const IconButton: React.FunctionComponent<IProps> = ({onClick, iconName, tooltip, uiTheme}) => (
    <div
        data-flow={'down'}
        data-test-id={tooltip}
        data-sd-tooltip={tooltip}
        className="Editor3-styleButton"
        style={uiTheme == null ? undefined : {color: uiTheme.textColor}}
    >
        <span role="button" onClick={onClick}><i className={`icon-${iconName}`} /></span>
    </div>
);
