import React from 'react';
import classNames from 'classnames';
import {connect} from 'react-redux';
import {EditorState, SelectionState} from 'draft-js';
import {IAuthoringSectionTheme} from 'apps/authoring-react/authoring-section/authoring-section';

interface IProps {
    iconName: string;
    editorState: EditorState;
    tooltip: string;
    precondition?: boolean;
    uiTheme?: IAuthoringSectionTheme;
    onClick: (args: {selection: SelectionState}) => void;
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SelectionButton
 * @param {Object} editorState The editor state object.
 * @description SelectionButton is a button that can be added to the toolbar, which only
 * becomes active and clickable when a selection is made in the editor. This is for actions
 * that are bound exclusively to having text selected in the editor, such as: links, comments,
 * annotations, etc. Note that a precondition prop may be supplied which precedes any other condition.
 */
const SelectionButtonComponent: React.StatelessComponent<IProps> = (
    {editorState, onClick, tooltip, iconName, uiTheme, precondition = true},
) => {
    const isCollapsed = editorState.getSelection().isCollapsed();
    const inactive = precondition === false || isCollapsed;
    const cx = classNames({inactive});

    const clickHandler = () => {
        if (!inactive) {
            onClick({
                selection: editorState.getSelection(),
            });
        }
    };

    return (
        <div
            data-flow={'down'}
            data-sd-tooltip={tooltip}
            className="Editor3-styleButton"
            style={{color: uiTheme.textColor}}
        >
            <span className={cx} onClick={clickHandler}>
                <i className={`icon-${iconName}`} />
            </span>
        </div>
    );
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
});

export const SelectionButton = connect(mapStateToProps, null)(SelectionButtonComponent);
