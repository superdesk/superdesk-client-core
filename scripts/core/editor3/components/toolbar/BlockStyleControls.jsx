import React, {Component} from 'react';
import {RichUtils} from 'draft-js';
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
export default class BlockStyleControls extends Component {
    constructor(props) {
        super(props);

        this.toggleBlockType = this.toggleBlockType.bind(this);
    }

    /** Handle the toolbar button pressed event */
    toggleBlockType(blockType) {
        const {editorState, onChange} = this.props;
        const stateAfterChange = RichUtils.toggleBlockType(
            editorState,
            blockType
        );

        onChange(stateAfterChange);
    }

    render() {
        const {editorState, options} = this.props;
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
                        onToggle={this.toggleBlockType}
                        style={BLOCK_TYPES_STYLE[type]}
                    />
                )}
            </span>
        );
    }
}

BlockStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    options: React.PropTypes.array,
    onChange: React.PropTypes.func.isRequired
};
