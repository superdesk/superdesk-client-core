import React from 'react';
import PropTypes from 'prop-types';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {connect} from 'react-redux';

/**
 * @type {Object}
 * @description Maps server 'editorFormat' options to Draft inline styles.
 */
const inlineStyles = {
    bold: 'BOLD',
    italic: 'ITALIC',
    underline: 'UNDERLINE'
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name InlineStyleButtons
 * @description Inline style functional component, will manage the inline style related toolbar buttons
 */
export const InlineStyleButtonsComponent = ({editorFormat, editorState, toggleInlineStyle}) => {
    const currentStyle = editorState.getCurrentInlineStyle();

    return (
        <span>
            {editorFormat.filter((type) => type in inlineStyles).map((type) =>
                <StyleButton
                    key={type}
                    active={currentStyle.has(inlineStyles[type])}
                    label={type}
                    onToggle={toggleInlineStyle}
                    style={inlineStyles[type]}
                />
            )}
        </span>
    );
};

InlineStyleButtonsComponent.propTypes = {
    editorState: PropTypes.object,
    editorFormat: PropTypes.array,
    toggleInlineStyle: PropTypes.func
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    editorFormat: state.editorFormat
});

const mapDispatchToProps = (dispatch) => ({
    toggleInlineStyle: (type) => dispatch(actions.toggleInlineStyle(type))
});

const InlineStyleButtons = connect(mapStateToProps, mapDispatchToProps)(InlineStyleButtonsComponent);

export default InlineStyleButtons;
