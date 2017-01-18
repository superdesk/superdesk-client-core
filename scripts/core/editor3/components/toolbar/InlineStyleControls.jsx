import React from 'react';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {connect} from 'react-redux';

/** The list of supported inline styles */
const INLINE_STYLES = {
    bold: 'BOLD',
    italic: 'ITALIC',
    underline: 'UNDERLINE'
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name InlineStyleControls
 * @description Inline style functional component, will manage the inline style related toolbar buttons
 */
const InlineStyleControlsComponent = ({options, editorState, toggleInlineStyle}) => {
    const currentStyle = editorState.getCurrentInlineStyle();

    return (
        <span>
            {options.filter((type) => type in INLINE_STYLES).map((type) =>
                <StyleButton
                    key={type}
                    active={currentStyle.has(INLINE_STYLES[type])}
                    label={type}
                    onToggle={toggleInlineStyle}
                    style={INLINE_STYLES[type]}
                />
            )}
        </span>
    );
};

InlineStyleControlsComponent.propTypes = {
    editorState: React.PropTypes.object,
    options: React.PropTypes.array,
    toggleInlineStyle: React.PropTypes.func
};

const mapStateToProps = (state, ownProps) => ({
    editorState: state.editorState,
    options: state.editorFormat
});

const mapDispatchToProps = (dispatch) => ({
    toggleInlineStyle: (type) => dispatch(actions.toggleInlineStyle(type))
});

const InlineStyleControls = connect(mapStateToProps, mapDispatchToProps)(InlineStyleControlsComponent);

export default InlineStyleControls;
