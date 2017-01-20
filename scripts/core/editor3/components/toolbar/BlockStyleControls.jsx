import React from 'react';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {connect} from 'react-redux';

/** The list of supported block types style */
const BLOCK_TYPES_STYLE = {
    h1: 'header-one',
    h2: 'header-two',
    h3: 'header-three',
    h4: 'header-four',
    h5: 'header-five',
    h6: 'header-six',
    quote: 'blockquote',
    ul: 'unordered-list-item',
    ol: 'ordered-list-item'
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name BlockStyleControl
 * @description Blocks style controls (h1, h2, h3, ...)
 */
const BlockStyleControlsComponent = ({editorState, options, toggleBlockStyle}) => {
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <span>
            {options.filter((type) => type in BLOCK_TYPES_STYLE).map((type) =>
                <StyleButton
                    key={type}
                    active={BLOCK_TYPES_STYLE[type] === blockType}
                    label={type}
                    onToggle={toggleBlockStyle}
                    style={BLOCK_TYPES_STYLE[type]}
                />
            )}
        </span>
    );
};

BlockStyleControlsComponent.propTypes = {
    editorState: React.PropTypes.object,
    toggleBlockStyle: React.PropTypes.func,
    options: React.PropTypes.array
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    options: state.editorFormat
});

const mapDispatchToProps = (dispatch) => ({
    toggleBlockStyle: (blockType) => dispatch(actions.toggleBlockStyle(blockType))
});

const BlockStyleControls = connect(mapStateToProps, mapDispatchToProps)(BlockStyleControlsComponent);

export default BlockStyleControls;
