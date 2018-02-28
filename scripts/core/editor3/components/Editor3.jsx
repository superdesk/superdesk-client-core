import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Editor3Component} from './Editor3Component';
import {MultipleHighlights} from './MultipleHighlights';
import {getHighlightsState, setHighlightsState, availableHighlights} from '../helpers/highlights';
import * as actions from '../actions';

function hadHighlightsChanged(prevEditorState, nextEditorState) {
    return getHighlightsState(prevEditorState) !== getHighlightsState(nextEditorState);
}

export class Editor3Base extends React.Component {
    static getDecorator(disableSpellchecker) {
        return Editor3Component.getDecorator(disableSpellchecker);
    }

    onHighlightChange(editorState, hightlightsState) {
        const newEditorState = setHighlightsState(editorState, hightlightsState);

        this.props.onChange(newEditorState);
    }

    render() {
        var props = {
            ...this.props,
            availableHighlights: availableHighlights,
            onHighlightChange: this.onHighlightChange.bind(this),
            hadHighlightsChanged: hadHighlightsChanged,
            getHighlightsState: getHighlightsState,
            setHighlightsState: setHighlightsState
        };

        return (
            <MultipleHighlights {...props}>
                <Editor3Component />
            </MultipleHighlights>
        );
    }
}

Editor3Base.propTypes = Editor3Component.propTypes = {
    onChange: PropTypes.func,
};

const mapStateToProps = (state) => ({
    readOnly: state.readOnly,
    showToolbar: state.showToolbar,
    highlightsEnabled: state.allowsHighlights,
    editorState: state.editorState,
    locked: state.locked,
    editorFormat: state.editorFormat,
    tabindex: state.tabindex,
    suggestingMode: state.suggestingMode,
    invisibles: state.invisibles,
    svc: state.svc
});

const mapDispatchToProps = (dispatch) => ({
    onChange: (editorState) => dispatch(actions.changeEditorState(editorState)),
    onTab: (e) => dispatch(actions.handleEditorTab(e)),
    dragDrop: (transfer, mediaType) => dispatch(actions.dragDrop(transfer, mediaType)),
    unlock: () => dispatch(actions.setLocked(false)),
    dispatch: (x) => dispatch(x),
    onCreateAddSuggestion: (chars) => dispatch(actions.createAddSuggestion(chars)),
    onCreateDeleteSuggestion: (action) => dispatch(actions.createDeleteSuggestion(action)),
    onPasteFromSuggestingMode: (content) => dispatch(actions.onPasteFromSuggestingMode(content))
});

export const Editor3 = connect(mapStateToProps, mapDispatchToProps)(Editor3Base);
