import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Editor3Component} from './Editor3Component';
import {MultipleHighlights} from './MultipleHighlights';
import {highlightsConfig} from './highlightsConfig';
import * as actions from '../actions';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor} from '../helpers/editor3CustomData';

function getInitialHighlightsState() {
    return {
        highlightsStyleMap: {},
        highlightsData: {},
        lastHighlightIds: Object.keys(availableHighlights).reduce((obj, key) => {
            obj[key] = 0;
            return obj;
        }, {})
    };
}

function getHighlightsState(editorState) {
    return getCustomDataFromEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS_STORAGE_KEY)
        || getInitialHighlightsState();
}

function setHighlightsState(editorState, hightlightsState) {
    return setCustomDataForEditor(editorState, editor3DataKeys.MULTIPLE_HIGHLIGHTS_STORAGE_KEY, hightlightsState)
}

function hadHighlightsChanged(prevEditorState, nextEditorState) {
    return getHighlightsState(prevEditorState) !== getHighlightsState(nextEditorState);
}

const availableHighlights = Object.keys(highlightsConfig).reduce((obj, key) => {
    obj[key] = highlightsConfig[key].draftStyleMap;
    return obj;
}, {});

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
