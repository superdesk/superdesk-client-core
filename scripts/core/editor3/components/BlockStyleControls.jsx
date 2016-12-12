import React from 'react';
import StyleButton from './StyleButton';

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
 * @description TODO(gbbr)
 */
const BlockStyleControls = (props) => {
    const {editorState, options} = props;
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
                    onToggle={props.onToggle}
                    style={BLOCK_TYPES_STYLE[type]}
                />
            )}
        </span>
    );
};

BlockStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    options: React.PropTypes.array,
    onToggle: React.PropTypes.func
};

export default BlockStyleControls;
