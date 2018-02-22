import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Map} from 'immutable';

import {Editor3Component} from './Editor3Component';
import {MultipleHighlights} from './MultipleHighlights';
import {highlightsConfig} from './highlightsConfig';
import * as actions from '../actions';
import {MULTIPLE_HIGHLIGHTS_STORAGE_KEY} from '../constants';
import {
    SelectionState,
    Modifier,
    EditorState,
} from 'draft-js';


const availableHighlights = Object.keys(highlightsConfig).reduce((obj, key) => {
    obj[key] = highlightsConfig[key].draftStyleMap;
    return obj;
}, {});

function getHighlightsData(editorState) {
    return editorState
        .getCurrentContent()
        .getFirstBlock()
        .getData()
        .get(MULTIPLE_HIGHLIGHTS_STORAGE_KEY);
}

function hadHighlightsChanged(prevEditorState, nextEditorState) {
    return getHighlightsData(prevEditorState) !== getHighlightsData(nextEditorState);
}

export class Editor3Base extends React.Component {
    static getDecorator(disableSpellchecker) {
        return Editor3Component.getDecorator(disableSpellchecker);
    }
    onHighlightChange(nextEditorState, hightlightsState) {
        let content = nextEditorState.getCurrentContent();
        const firstBlockSelection = SelectionState.createEmpty(content.getFirstBlock().getKey());
        const multipleHighlightsData = Map()
            .set(MULTIPLE_HIGHLIGHTS_STORAGE_KEY, hightlightsState);

        content = Modifier.mergeBlockData(content, firstBlockSelection, multipleHighlightsData);

        var editorStateWithHighlightsData = EditorState.push(nextEditorState, content, 'change-inline-style');

        this.props.onChange(editorStateWithHighlightsData);
    }
    render() {
        const initialState = getHighlightsData(this.props.editorState);
        var props = {
            ...this.props,
            availableHighlights: availableHighlights,
            onHighlightChange: this.onHighlightChange.bind(this),
            hadHighlightsChanged: hadHighlightsChanged,
            initialState: initialState
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
