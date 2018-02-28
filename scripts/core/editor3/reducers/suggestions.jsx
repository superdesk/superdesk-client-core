import {EditorState, Modifier, RichUtils} from 'draft-js';
import {onChange} from './editor3';
import {acceptedInlineStyles} from '../helpers/inlineStyles';
import {
    getHighlightStyleAtOffset,
    getCharByOffset,
    getHighlightData,
    addHighlightData,
    deleteHighlight
} from '../helpers/highlights';


const suggestions = (state = {}, action) => {
    switch (action.type) {
    case 'TOGGLE_SUGGESTING_MODE':
        return toggleSuggestingMode(state);
    case 'CREATE_ADD_SUGGESTION':
        return createAddSuggestion(state, action.payload);
    case 'CREATE_DELETE_SUGGESTION':
        return createDeleteSuggestion(state, action.payload);
    case 'PASTE_ADD_SUGGESTION':
        return pasteAddSuggestion(state, action.payload);
    case 'ACCEPT_SUGGESTION':
        return processSuggestion(state, action.payload, true);
    case 'REJECT_SUGGESTION':
        return processSuggestion(state, action.payload, false);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name toggleSuggestingMode
 * @param {Object} state
 * @return {Object} returns new state
 * @description Disable/enable the suggesting mode.
 */
const toggleSuggestingMode = (state) => {
    const {suggestingMode} = state;

    return {
        ...state,
        suggestingMode: !suggestingMode
    };
};

/**
 * @ngdoc method
 * @name createAddSuggestion
 * @param {Object} state
 * @param {String} text - the suggestion added text
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type ADD.
 */
const createAddSuggestion = (state, {text, data}) => {
    let {editorState} = state;

    editorState = deleteCurrentSelection(editorState, data);

    for (let i = 0; i < text.length; i++) {
        // for every character from inserted text apply add suggestion
        editorState = setAddSuggestionForCharacter(editorState, data, text[i]);
    }

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name createDeleteSuggestion
 * @param {Object} state
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type DELETE.
 */
const createDeleteSuggestion = (state, {action, data}) => {
    let {editorState} = state;
    const selection = editorState.getSelection();
    const selectionLength = selection.getEndOffset() - selection.getStartOffset();

    if (selectionLength === 0) {
        if (action === 'backspace') {
            editorState = changeEditorSelection(editorState, -1, 0, false);
        } else {
            editorState = changeEditorSelection(editorState, 0, 1, false);
        }
    }
    editorState = deleteCurrentSelection(editorState, data);

    if (selectionLength === 0 && action !== 'backspace') {
        editorState = changeEditorSelection(editorState, 1, 1, false);
    }

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name pasteAddSuggestion
 * @param {Object} state
 * @param {Object} content - the suggestion added content
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type ADD based on content.
 */
const pasteAddSuggestion = (state, {content, data}) => {
    let {editorState} = state;
    const blockMap = content.getBlockMap();

    editorState = deleteCurrentSelection(editorState, data);

    blockMap.forEach((block) => {
        if (block.getType() !== 'atomic') {
            const text = block.getText();
            const characterMetadataList = block.getCharacterList();
            let inlineStyle;

            characterMetadataList.forEach((characterMetadata, i) => {
                inlineStyle = acceptedInlineStyles.filter((style) => characterMetadata.hasStyle(style));
                editorState = setAddSuggestionForCharacter(editorState, data, text[i], inlineStyle);
            });
        } else {
            // TODO: insert block
        }
    });

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name processSuggestion
 * @param {Object} state
 * @param {Object} selection - the selection of suggestion
 * @param {Boolean} accepted - the suggestion is accepted
 * @return {Object} returns new state
 * @description Accept or reject the suggestions in the selection.
 */
const processSuggestion = (state, {selection}, accepted) => {
    const types = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
    const start = selection.getStartOffset();
    const end = selection.getEndOffset();
    let {editorState} = state;
    let style;
    let data;

    for (let i = end - start - 1; i >= 0; i--) {
        style = getHighlightStyleAtOffset(editorState, types, selection, i);
        data = getHighlightData(editorState, style);
        if (data == null) {
            continue;
        }

        const applySuggestion = data.type === 'ADD_SUGGESTION' && accepted ||
            data.type === 'DELETE_SUGGESTION' && !accepted;
        const newSelection = selection.merge({
            anchorOffset: start + i + (applySuggestion ? 0 : 1),
            focusOffset: start + i + (applySuggestion ? 0 : 1),
            isBackward: false
        });

        editorState = EditorState.acceptSelection(editorState, newSelection);

        if (applySuggestion) {
            // keep character and clean suggestion style and entity
            editorState = resetSuggestion(editorState, style);
        } else {
            // delete current character
            editorState = deleteCharacter(editorState);
        }
    }

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name deleteCurrentSelection
 * @param {Object} editorState
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Set the delete suggestion for current editor selection.
 */
const deleteCurrentSelection = (editorState, data) => {
    const selection = editorState.getSelection();
    const selectionLength = selection.getEndOffset() - selection.getStartOffset();
    let newState = editorState;

    if (selectionLength !== 0) {
        // if text is selected, apply delete suggestion for every selected character
        newState = changeEditorSelection(newState, selectionLength, 0, false);
        for (let i = 0; i < selectionLength; i++) {
            newState = setDeleteSuggestionForCharacter(newState, data);
        }
    }

    return newState;
};

/**
 * @ngdoc method
 * @name setAddSuggestionForCharacter
 * @param {Object} state
 * @param {String} text - the suggestion added text
 * @param {Object} inlineStyle - the style for the text
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Set the add suggestion for current character.
 *   On suggestion mode:
 *   1. next neighbor is 'delete suggestion' with same user and the same char as added one -> reset delete entity
 *       1.1. if both neighbors are 'new suggestion' and has the same user -> concatenate them?
 *   2. at least one of neighbors is 'new suggestion' and has same user -> set the same entity
 *   3. other cases -> add new 'new suggestion'
 *       3.1 if the neighbors had the same entity -> split the entity/group?
 *   Not on suggestion mode:
 *   1. both are 'new suggestion' neighbors with the same user -> set same entity
 */
const setAddSuggestionForCharacter = (editorState, data, text, inlineStyle = null, entityKey = null) => {
    const crtInlineStyle = inlineStyle || editorState.getCurrentInlineStyle();
    const types = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
    let selection = editorState.getSelection();
    const beforeStyle = getHighlightStyleAtOffset(editorState, types, selection, -1);
    const beforeData = getHighlightData(editorState, beforeStyle);
    const currentStyle = getHighlightStyleAtOffset(editorState, types, selection, 0);
    const currentData = getHighlightData(editorState, currentStyle);
    let content = editorState.getCurrentContent();
    const currentChar = getCharByOffset(editorState, selection, 0);
    let newState = editorState;

    if (currentChar === text && currentData != null
        && currentData.type === 'DELETE_SUGGESTION'
        && currentData.author === data.author) {
        // if next character is the same as the new one and is delete suggestion -> reset entity
        newState = resetSuggestion(newState, currentStyle);
        return newState;
    }

    content = Modifier.insertText(content, selection, text);
    newState = EditorState.push(newState, content, 'insert-characters');
    newState = changeEditorSelection(newState, -1, 0, false);

    if (beforeData != null && beforeData.type === 'ADD_SUGGESTION'
        && beforeData.author === data.author) {
        // if previous character is an add suggestion of the same user, set the same entity
        newState = applyStyleForSuggestion(newState, crtInlineStyle, beforeStyle);
    } else if (currentData != null && currentData.type === 'ADD_SUGGESTION'
        && currentData.author === data.author) {
        // if next character is an add suggestion of the same user, set the same entity
        newState = applyStyleForSuggestion(newState, crtInlineStyle, currentStyle);
    } else {
        // create a new suggestion
        newState = addHighlightData(newState, 'ADD_SUGGESTION', data);
    }

    newState = changeEditorSelection(newState, 1, 0, true);

    return newState;
};

/**
 * @ngdoc method
 * @name createDeleteSuggestion
 * @param {Object} state
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Set the delete suggestion for current character.
 *    On suggestion mode:
 *   1. if previous neighbor is 'new suggestion' with the same user -> delete char
 *       1.1. if both new neighbors are 'new suggestion' and has the same user -> concatenate them?
 *   2. at least one of neighbors is 'delete suggestion' and has same user -> set the same entity
 *   3. other cases -> add new 'delete suggestion'
 *       3.1 if the neighbors had the same entity -> split the entity/group?
 *   Not on suggestion mode:
 *   1. both are 'delete suggestion' neighbors with the same user -> set same entity
 */
const setDeleteSuggestionForCharacter = (editorState, data) => {
    const types = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
    let selection = editorState.getSelection();
    const currentStyle = getHighlightStyleAtOffset(editorState, types, selection, -1);
    const currentData = getHighlightData(editorState, currentStyle);

    if (currentData != null && currentData.type === 'DELETE_SUGGESTION') {
        // if current character is already marked as a delete suggestion, skip
        return changeEditorSelection(editorState, -1, -1, true);
    }

    if (currentData != null && currentData.type === 'ADD_SUGGESTION' &&
        currentData.author === data.author) {
        // if current character already a suggestion of current user, delete the character
        return deleteCharacter(editorState);
    }

    const beforeStyle = getHighlightStyleAtOffset(editorState, types, selection, -2);
    const beforeData = getHighlightData(editorState, beforeStyle);
    const afterStyle = getHighlightStyleAtOffset(editorState, types, selection, 0);
    const afterData = getHighlightData(editorState, afterStyle);
    let newState = changeEditorSelection(editorState, -1, 0, false);

    if (beforeData != null && beforeData.type === 'DELETE_SUGGESTION'
        && beforeData.author === data.author) {
        // if previous character is a delete suggestion of the same user, set the same entity
        newState = RichUtils.toggleInlineStyle(newState, beforeStyle);
    } else if (afterData != null && afterData.type === 'DELETE_SUGGESTION'
        && afterData.author === data.author) {
        // if next character is a delete suggestion of the same user, set the same entity
        newState = RichUtils.toggleInlineStyle(newState, afterStyle);
    } else {
        // create a new suggestion
        newState = addHighlightData(newState, 'DELETE_SUGGESTION', data);
    }

    return changeEditorSelection(newState, 0, -1, true);
};

/**
 * @ngdoc method
 * @name applyStyleForSuggestion
 * @param {Object} editorState
 * @param {Objest} inlineStyle
 * @param {String} style
 * @return {Object} returns new state
 * @description Apply the style for current selection.
 */
const applyStyleForSuggestion = (editorState, inlineStyle, style) => {
    let newState = editorState;

    inlineStyle.forEach((style) => {
        if (style.indexOf('ADD_SUGGESTION') === -1 && style.indexOf('DELETE_SUGGESTION') === -1) {
            newState = RichUtils.toggleInlineStyle(newState, style);
        }
    });

    return RichUtils.toggleInlineStyle(newState, style);
};

/**
 * @ngdoc method
 * @name resetSuggestion
 * @param {Object} editorState
 * @param {String} style
 * @return {Object} returns new state
 * @description For type suggestion reset both style and entity for
 * current character position.
 */
const resetSuggestion = (editorState, style) => {
    let newState = editorState;

    newState = changeEditorSelection(newState, 0, 1, false);
    newState = deleteHighlight(newState, style);
    newState = changeEditorSelection(newState, 1, 0, false);

    return newState;
};

/**
 * @ngdoc method
 * @name deleteCharacter
 * @param {Object} editorState
 * @return {Object} returns new state
 * @description Delete the current character.
 */
const deleteCharacter = (editorState) => {
    let content;
    let selection;
    let newState;

    newState = changeEditorSelection(editorState, -1, 0, false);
    content = newState.getCurrentContent();
    selection = newState.getSelection();

    content = Modifier.removeRange(content, selection, 'forward');
    newState = EditorState.push(newState, content, 'backspace-character');

    return changeEditorSelection(newState, 0, 0, true);
};

/**
 * @ngdoc method
 * @name changeEditorSelection
 * @param {Object} editorState
 * @param {Integer} startOffset - the anchor offset relative to current start offset
 * @param {Integer} endOffset - the focus offset relative to current end offset
 * @param {Boolean} force - apply accept or force selection
 * @return {Object} returns new state
 * @description Change the current editor selection.
 */
const changeEditorSelection = (editorState, startOffset, endOffset, force) => {
    const selection = editorState.getSelection();
    const newSelection = selection.merge({
        anchorOffset: selection.getStartOffset() + startOffset,
        focusOffset: selection.getEndOffset() + endOffset,
        isBackward: false
    });

    if (force) {
        return EditorState.forceSelection(editorState, newSelection);
    }

    return EditorState.acceptSelection(editorState, newSelection);
};

export default suggestions;
