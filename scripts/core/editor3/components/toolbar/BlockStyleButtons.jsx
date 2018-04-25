import React, {Component} from 'react';
import PropTypes from 'prop-types';
import StyleButton from './StyleButton';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import * as Suggestions from '../../helpers/suggestions';

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
    'unordered list': 'unordered-list-item',
    'ordered list': 'ordered-list-item',
    pre: 'code-block',
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name BlockStyleControl
 * @description Blocks style controls (h1, h2, h3, ...)
 */
export class BlockStyleButtonsComponent extends Component {
    constructor(props) {
        super(props);

        this.onToggle = this.onToggle.bind(this);
    }

    onToggle(type, active) {
        const {editorState, suggestingMode, toggleBlockStyle, createChangeBlockStyleSuggestion} = this.props;

        if (suggestingMode) {
            // select the whole paragraph(s) and then check if
            // no other user has a suggestion on that selection
            if (!Suggestions.allowEditSuggestionOnBlock(editorState)) {
                return;
            }

            createChangeBlockStyleSuggestion(type, active);
        } else {
            toggleBlockStyle(type);
        }
    }

    render() {
        const {editorState, editorFormat} = this.props;
        const selection = editorState.getSelection();
        const blockStyleKeys = Object.keys(blockStyles);
        const blockType = editorState
            .getCurrentContent()
            .getBlockForKey(selection.getStartKey())
            .getType();

        return (
            <span>
                {blockStyleKeys.filter((type) => editorFormat.indexOf(type) > -1).map((type) =>
                    <StyleButton
                        key={type}
                        active={blockStyles[type] === blockType}
                        label={type}
                        onToggle={this.onToggle}
                        style={blockStyles[type]}
                    />
                )}
            </span>
        );
    }
}

BlockStyleButtonsComponent.propTypes = {
    editorState: PropTypes.object,
    suggestingMode: PropTypes.bool,
    editorFormat: PropTypes.array,
    toggleBlockStyle: PropTypes.func,
    createChangeBlockStyleSuggestion: PropTypes.func,
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    editorFormat: state.editorFormat,
    suggestingMode: state.suggestingMode,
});

const mapDispatchToProps = (dispatch) => ({
    toggleBlockStyle: (blockType) => dispatch(actions.toggleBlockStyle(blockType)),
    createChangeBlockStyleSuggestion:
        (type, active) => dispatch(actions.createChangeBlockStyleSuggestion(type, active)),
});

const BlockStyleButtons = connect(mapStateToProps, mapDispatchToProps)(BlockStyleButtonsComponent);

export default BlockStyleButtons;
