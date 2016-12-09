import React from 'react';
import StyleButton from './StyleButton';

/** The list of supported inline styles */
const INLINE_STYLES = {
    bold: 'BOLD',
    italic: 'ITALIC',
    underline: 'UNDERLINE'
};

/** Inline style functional component, will manage the inline style related toolbar buttons */
const InlineStyleControls = (props) => {
    var currentStyle = props.editorState.getCurrentInlineStyle();
    const {options} = props;

    return (
        <span>
            {options.filter((type) => type in INLINE_STYLES).map((type) =>
                <StyleButton
                    key={type}
                    active={currentStyle.has(INLINE_STYLES[type])}
                    label={type}
                    onToggle={props.onToggle}
                    style={INLINE_STYLES[type]}
                />
            )}
        </span>
    );
};

InlineStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    options: React.PropTypes.array,
    onToggle: React.PropTypes.func
};

export default InlineStyleControls;
