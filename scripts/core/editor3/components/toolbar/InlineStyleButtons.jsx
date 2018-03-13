import React, {Component} from 'react';
import PropTypes from 'prop-types';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {inlineStyles} from '../../helpers/inlineStyles';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name InlineStyleButtons
 * @description Inline style functional component, will manage the inline style related toolbar buttons
 */
export class InlineStyleButtonsComponent extends Component {
    constructor(props) {
        super(props);

        this.onToggle = this.onToggle.bind(this);
    }

    onToggle(type) {
        const {editorState, suggestingMode, toggleInlineStyle, createChangeStyleSuggestion} = this.props;
        const selection = editorState.getSelection();

        if (suggestingMode && selection.getStartOffset() !== selection.getEndOffset()) {
            createChangeStyleSuggestion(type);
        } else {
            toggleInlineStyle(type);
        }
    }

    render() {
        const {editorFormat, editorState} = this.props;
        const currentStyle = editorState.getCurrentInlineStyle();

        return (
            <span>
                {editorFormat.filter((type) => type in inlineStyles).map((type) =>
                    <StyleButton
                        key={type}
                        active={currentStyle.has(inlineStyles[type])}
                        label={type}
                        onToggle={this.onToggle}
                        style={inlineStyles[type]}
                    />
                )}
            </span>
        );
    }
}

InlineStyleButtonsComponent.propTypes = {
    editorState: PropTypes.object,
    editorFormat: PropTypes.array,
    suggestingMode: PropTypes.bool,
    toggleInlineStyle: PropTypes.func,
    createChangeStyleSuggestion: PropTypes.func
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    editorFormat: state.editorFormat,
    suggestingMode: state.suggestingMode
});

const mapDispatchToProps = (dispatch) => ({
    toggleInlineStyle: (type) => dispatch(actions.toggleInlineStyle(type)),
    createChangeStyleSuggestion: (type) => dispatch(actions.createChangeStyleSuggestion(type))
});

const InlineStyleButtons = connect(mapStateToProps, mapDispatchToProps)(InlineStyleButtonsComponent);

export default InlineStyleButtons;
