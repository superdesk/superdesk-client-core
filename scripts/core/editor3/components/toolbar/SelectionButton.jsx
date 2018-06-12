import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';

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
const SelectionButtonComponent = ({editorState, onClick, tooltip, iconName, precondition}) => {
    const isCollapsed = editorState.getSelection().isCollapsed();
    const inactive = !precondition || isCollapsed;
    const cx = classNames({inactive});

    const clickHandler = () => {
        if (!inactive) {
            onClick(editorState.getSelection());
        }
    };

    return (
        <div data-flow={'down'} data-sd-tooltip={tooltip} className="Editor3-styleButton">
            <span className={cx} onClick={clickHandler}>
                <i className={`icon-${iconName}`} />
            </span>
        </div>
    );
};

SelectionButtonComponent.propTypes = {
    iconName: PropTypes.string.isRequired,
    editorState: PropTypes.object.isRequired,
    tooltip: PropTypes.string,
    precondition: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
};

SelectionButtonComponent.defaultProps = {
    precondition: true,
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    options: state.editorFormat,
});

export const SelectionButton = connect(mapStateToProps, null)(SelectionButtonComponent);
