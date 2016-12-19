import React, {Component} from 'react';
import {RichUtils} from 'draft-js';
import StyleButton from './StyleButton';

/** The list of supported inline styles */
const INLINE_STYLES = {
    bold: 'BOLD',
    italic: 'ITALIC',
    underline: 'UNDERLINE'
};

/** Inline style functional component, will manage the inline style related toolbar buttons */
export default class InlineStyleControls extends Component {
    constructor(props) {
        super(props);

        this.toggleInlineStyle = this.toggleInlineStyle.bind(this);
    }

    /** Handle the toolbar button pressed event */
    toggleInlineStyle(inlineStyle) {
        const {editorState, onChange} = this.props;
        const stateAfterChange = RichUtils.toggleInlineStyle(
            editorState,
            inlineStyle
        );

        onChange(stateAfterChange);
    }

    render() {
        const {options, editorState} = this.props;
        const currentStyle = editorState.getCurrentInlineStyle();

        return (
            <span>
                {options.filter((type) => type in INLINE_STYLES).map((type) =>
                    <StyleButton
                        key={type}
                        active={currentStyle.has(INLINE_STYLES[type])}
                        label={type}
                        onToggle={this.toggleInlineStyle}
                        style={INLINE_STYLES[type]}
                    />
                )}
            </span>
        );
    }
}

InlineStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    options: React.PropTypes.array,
    onChange: React.PropTypes.func.isRequired
};
