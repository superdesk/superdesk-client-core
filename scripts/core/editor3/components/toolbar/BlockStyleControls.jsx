import React from 'react';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {connect} from 'react-redux';

/**
 * @type {Object}
 * @description Maps server 'editorFormat' options to Draft styles.
 */
const blockStyles = {
    h1: 'header-one',
    h2: 'header-two',
    h3: 'header-three',
    h4: 'header-four',
    h5: 'header-five',
    h6: 'header-six',
    quote: 'blockquote',
    unorderedlist: 'unordered-list-item',
    orderedlist: 'ordered-list-item'
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name BlockStyleControl
 * @description Blocks style controls (h1, h2, h3, ...)
 */
export const BlockStyleControlsComponent = ({editorState, editorFormat, toggleBlockStyle}) => {
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <span>
            {editorFormat.filter((type) => type in blockStyles).map((type) =>
                <StyleButton
                    key={type}
                    active={blockStyles[type] === blockType}
                    label={type}
                    onToggle={toggleBlockStyle}
                    style={blockStyles[type]}
                />
            )}
        </span>
    );
};

BlockStyleControlsComponent.propTypes = {
    editorState: React.PropTypes.object,
    toggleBlockStyle: React.PropTypes.func,
    editorFormat: React.PropTypes.array
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    editorFormat: state.editorFormat
});

const mapDispatchToProps = (dispatch) => ({
    toggleBlockStyle: (blockType) => dispatch(actions.toggleBlockStyle(blockType))
});

const BlockStyleControls = connect(mapStateToProps, mapDispatchToProps)(BlockStyleControlsComponent);

export default BlockStyleControls;
