import {EditorState, Modifier} from 'draft-js';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Spellchecker Reducers
 * @description Contains the list of spellchecker related reducers.
 */
const spellchecker = (state = {}, action) => {
    switch (action.type) {
    case 'SPELLCHECKER_REPLACE_WORD':
        return replaceWord(state, action.payload);
    case 'SPELLCHECKER_SHOW_CONTEXT_MENU':
        return showContextMenu(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name Spellchecker Reducers#replaceWord
 * @param {Object} state
 * @param {String} word
 * @return {Object} returns new state
 * @description Replace the current word with the new selected one
 */
const replaceWord = (state, text) => {
    const {editorState, spellcheckerState} = state;
    const {word, editorSelection} = spellcheckerState.contextMenuData;
    var textSelection;
    var newContentState;
    var newEditorState;

    textSelection = editorSelection.merge({
        anchorOffset: word.offset,
        focusOffset: word.offset + word.text.length
    });

    newContentState = Modifier.replaceText(editorState.getCurrentContent(), textSelection, text);
    newEditorState = EditorState.push(editorState, newContentState, 'spellchecker');

    return Object.assign({}, state, {
        editorState: newEditorState,
        spellcheckerState: Object.assign({}, spellcheckerState, {contextMenuData: null})
    });
};

/**
 * @ngdoc method
 * @name Spellchecker Reducers#showContextMenu
 * @param {Object} state
 * @param {String} contextMenuData
 * @return {Object} returns new state
 * @description Save on store all relevant data for spellchecker context menu
 */
const showContextMenu = (state, contextMenuData) => {
    const {editorState, spellcheckerState} = state;

    contextMenuData.editorSelection = editorState.getSelection();
    return Object.assign({}, state, {
        spellcheckerState: Object.assign({}, spellcheckerState, {contextMenuData})
    });
};

export default spellchecker;