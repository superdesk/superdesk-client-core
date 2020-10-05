import React from 'react';
import PropTypes from 'prop-types';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {inlineStyles} from '../../helpers/inlineStyles';
import * as Suggestions from '../../helpers/suggestions';
import {getCurrentAuthor} from '../../helpers/author';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name InlineStyleButtons
 * @description Inline style functional component, will manage the inline style related toolbar buttons
 */
export class InlineStyleButtonsComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.onToggle = this.onToggle.bind(this);
    }

    onToggle(type, active) {
        const author = getCurrentAuthor();
        const {editorState, suggestingMode, toggleInlineStyle, createChangeStyleSuggestion} = this.props;
        const selection = editorState.getSelection();

        if (suggestingMode && !selection.isCollapsed()) {
            if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)
                && !Suggestions.allowEditSuggestionOnRight(editorState, author)) {
                return;
            }

            createChangeStyleSuggestion(type, active);
        } else {
            toggleInlineStyle(type);
        }
    }

    render() {
        const {editorFormat, editorState} = this.props;
        const currentStyle = editorState.getCurrentInlineStyle();

        return (
            <span>
                {editorFormat.filter((type) => type in inlineStyles).map((type) => (
                    <StyleButton
                        key={type}
                        active={currentStyle.has(inlineStyles[type])}
                        label={type}
                        onToggle={this.onToggle}
                        style={inlineStyles[type]}
                    />
                ))}
            </span>
        );
    }
}

InlineStyleButtonsComponent.propTypes = {
    editorState: PropTypes.object,
    editorFormat: PropTypes.array,
    suggestingMode: PropTypes.bool,
    toggleInlineStyle: PropTypes.func,
    createChangeStyleSuggestion: PropTypes.func,
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    editorFormat: state.editorFormat,
    suggestingMode: state.suggestingMode,
});

const mapDispatchToProps = (dispatch) => ({
    toggleInlineStyle: (type) => dispatch(actions.toggleInlineStyle(type)),
    createChangeStyleSuggestion: (type, active) => dispatch(actions.createChangeStyleSuggestion(type, active)),
});

const InlineStyleButtons = connect(mapStateToProps, mapDispatchToProps)(InlineStyleButtonsComponent);

export default InlineStyleButtons;
