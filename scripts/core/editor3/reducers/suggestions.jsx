import {EditorState, Modifier, RichUtils} from 'draft-js';
import {onChange} from './editor3';
import {acceptedInlineStyles} from '../helpers/inlineStyles';
import {suggestionsTypes, styleSuggestionsTypes} from '../highlightsConfig';
import * as Highlights from '../helpers/highlights';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor} from '../helpers/editor3CustomData';
import ng from 'core/services/ng';


const suggestions = (state = {}, action) => {
    switch (action.type) {
    case 'TOGGLE_SUGGESTING_MODE':
        return toggleSuggestingMode(state);
    case 'CREATE_ADD_SUGGESTION':
        return createAddSuggestion(state, action.payload);
    case 'CREATE_DELETE_SUGGESTION':
        return createDeleteSuggestion(state, action.payload);
    case 'CREATE_CHANGE_STYLE_SUGGESTION':
        return createChangeStyleSuggestion(state, action.payload);
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
 * @name saveEditorStatus
 * @param {Object} state
 * @param {Object} tmpEditorState
 * @param {String} changeType
 * @return {Object} returns new state
 * @description Save the changes as a single change in undo stack.
 */
const saveEditorStatus = (state, tmpEditorState, changeType, restoreSelection = false) => {
    const {editorState} = state;
    const content = tmpEditorState.getCurrentContent();
    const selection = restoreSelection ? editorState.getSelection() : tmpEditorState.getSelection();
    let newEditorState;

    newEditorState = EditorState.push(editorState, content, changeType);
    newEditorState = EditorState.forceSelection(newEditorState, selection);

    return onChange(state, newEditorState);
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

    return saveEditorStatus(state, editorState, 'insert-characters');
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
    const noSelection = selection.getEndOffset() === selection.getStartOffset() &&
        selection.getStartKey() === selection.getEndKey();

    if (noSelection) {
        if (action === 'backspace') {
            editorState = Highlights.changeEditorSelection(editorState, -1, 0, false);
        } else {
            editorState = Highlights.changeEditorSelection(editorState, 0, 1, false);
        }
    }

    editorState = deleteCurrentSelection(editorState, data);

    if (noSelection && action !== 'backspace') {
        editorState = Highlights.changeEditorSelection(editorState, 1, 1, false);
    }

    return saveEditorStatus(state, editorState, 'change-inline-style');
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
const createChangeStyleSuggestion = (state, {style, data}) => {
    let {editorState} = state;
    const type = Highlights.getTypeByInlineStyle(style);
    const selection = editorState.getSelection();
    let crtStyle;

    editorState = Highlights.initSelectionIterator(editorState);
    while (Highlights.hasNextSelection(editorState, selection)) {
        crtStyle = Highlights.getHighlightStyleAtCurrentPosition(editorState, type);

        if (crtStyle) {
            editorState = resetSuggestion(editorState, crtStyle);
        } else {
            editorState = Highlights.changeEditorSelection(editorState, 1, 1, false);
        }
    }

    editorState = EditorState.acceptSelection(editorState, selection);
    editorState = Highlights.addHighlight(editorState, type, data);
    editorState = RichUtils.toggleInlineStyle(editorState, style);

    return saveEditorStatus(state, editorState, 'change-inline-style', true);
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

    return saveEditorStatus(state, editorState, 'change-block-data');
};

/**
 * @ngdoc method
 * @name saveToSuggestionsHistory
 * @param {Object} editorState
 * @param {Object} suggestion
 * @param {Boolean} accepted
 * @return {editorState} returns new state
 */
function saveToSuggestionsHistory(editorState, suggestion, accepted) {
    const resolvedSuggestions = getCustomDataFromEditor(
        editorState,
        editor3DataKeys.RESOLVED_SUGGESTIONS_HISTORY
    ) || [];

    return setCustomDataForEditor(
        editorState,
        editor3DataKeys.RESOLVED_SUGGESTIONS_HISTORY,
        resolvedSuggestions.concat({
            suggestionText: suggestion.suggestionText,
            suggestionInfo: {
                author: suggestion.author,
                date: suggestion.date,
                type: suggestion.type
            },
            resolutionInfo: {
                resolverUserId: ng.get('session').identity._id,
                date: new Date(),
                accepted: accepted
            }
        })
    );
}

/**
 * @ngdoc method
 * @name processSuggestion
 * @param {Object} state
 * @param {Object} suggestion
 * @param {Boolean} accepted - the suggestion is accepted
 * @return {Object} returns new state
 * @description Accept or reject the suggestions in the selection.
 */
const processSuggestion = (state, {suggestion}, accepted) => {
    const {selection} = suggestion;
    let {editorState} = state;
    let style;
    let data;

    editorState = saveToSuggestionsHistory(editorState, suggestion, accepted);
    editorState = EditorState.acceptSelection(editorState, suggestion.selection);

    if (styleSuggestionsTypes.indexOf(suggestion.type) !== -1) {
        editorState = Highlights.removeHighlight(editorState, suggestion.styleName);
        if (!accepted) {
            style = Highlights.getInlineStyleByType(suggestion.type);
            editorState = RichUtils.toggleInlineStyle(editorState, style);
        }

        return saveEditorStatus(state, editorState, 'change-inline-style', true);
    }

    editorState = Highlights.initSelectionIterator(editorState, true);
    while (Highlights.hasNextSelection(editorState, selection, true)) {
        editorState = Highlights.changeEditorSelection(editorState, -1, -1, false);
        style = Highlights.getHighlightStyleAtCurrentPosition(editorState, suggestionsTypes);
        data = Highlights.getHighlightData(editorState, style);
        if (data == null) {
            continue;
        }

        const applySuggestion = data.type === 'ADD_SUGGESTION' && accepted ||
            data.type === 'DELETE_SUGGESTION' && !accepted;

        // keep character and clean suggestion style and entity
        editorState = resetSuggestion(editorState, style);

        if (applySuggestion) {
            // keep character and clean suggestion style and entity
            editorState = resetSuggestion(editorState, style);
            editorState = Highlights.changeEditorSelection(editorState, -1, -1, false);
        } else {
            // delete current character
            editorState = Highlights.changeEditorSelection(editorState, 1, 1, false);
            editorState = deleteCharacter(editorState);
        }
    }

    return saveEditorStatus(state, editorState, 'change-block-data');
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
    const backward = true;
    let newState = editorState;

    newState = Highlights.initSelectionIterator(newState, backward);
    while (Highlights.hasNextSelection(newState, selection, backward)) {
        newState = setDeleteSuggestionForCharacter(newState, data);
    }

    return newState;
};

/**
 * @ngdoc method
 * @name setAddSuggestionForCharacter
 * @param {Object} state
 * @param {Object} data - info about the author of suggestion
 * @param {String} text - the suggestion added text
 * @param {Object} inlineStyle - the style for the text
 * @return {Object} returns new state
 * @description Set the add suggestion for current character.
 *   On suggestion mode:
 *   1. next neighbor is 'delete suggestion' with same user and the same char as added one -> reset related data
 *       1.1. if both neighbors are 'new suggestion' and has the same user -> concatenate them?
 *   2. at least one of neighbors is 'new suggestion' and has same user -> set the same data
 *   3. other cases -> add new 'new suggestion'
 */
const setAddSuggestionForCharacter = (editorState, data, text, inlineStyle = null) => {
    const crtInlineStyle = inlineStyle || editorState.getCurrentInlineStyle();
    let selection = editorState.getSelection();
    const beforeStyle = Highlights.getHighlightStyleAtOffset(editorState, suggestionsTypes, selection, -1);
    const beforeData = Highlights.getHighlightData(editorState, beforeStyle);
    const currentStyle = Highlights.getHighlightStyleAtOffset(editorState, suggestionsTypes, selection, 0);
    const currentData = Highlights.getHighlightData(editorState, currentStyle);
    let content = editorState.getCurrentContent();
    const currentChar = Highlights.getCharByOffset(editorState, selection, 0);
    let newState = editorState;

    if (currentChar === text && currentData != null
        && currentData.type === 'DELETE_SUGGESTION'
        && currentData.author === data.author) {
        // if next character is the same as the new one and is delete suggestion -> reset data
        newState = resetSuggestion(newState, currentStyle);
        return newState;
    }

    content = Modifier.insertText(content, selection, text);
    newState = EditorState.push(newState, content, 'insert-characters');
    newState = Highlights.changeEditorSelection(newState, -1, 0, false);

    if (beforeData != null && beforeData.type === 'ADD_SUGGESTION'
        && beforeData.author === data.author) {
        // if previous character is an add suggestion of the same user, set the same data
        newState = applyStyleForSuggestion(newState, crtInlineStyle, beforeStyle);
    } else if (currentData != null && currentData.type === 'ADD_SUGGESTION'
        && currentData.author === data.author) {
        // if next character is an add suggestion of the same user, set the same data
        newState = applyStyleForSuggestion(newState, crtInlineStyle, currentStyle);
    } else {
        // create a new suggestion
        newState = Highlights.addHighlight(newState, 'ADD_SUGGESTION', data);
    }

    newState = Highlights.changeEditorSelection(newState, 1, 0, true);

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
 *   2. at least one of neighbors is 'delete suggestion' and has same user -> set the same suggestion data
 *   3. other cases -> add new 'delete suggestion'
 */
const setDeleteSuggestionForCharacter = (editorState, data) => {
    let selection = editorState.getSelection();
    const currentStyle = Highlights.getHighlightStyleAtOffset(editorState, suggestionsTypes, selection, -1);
    const currentData = Highlights.getHighlightData(editorState, currentStyle);

    if (currentData != null && currentData.type === 'DELETE_SUGGESTION') {
        // if current character is already marked as a delete suggestion, skip
        return Highlights.changeEditorSelection(editorState, -1, -1, true);
    }

    if (currentData != null && currentData.type === 'ADD_SUGGESTION' &&
        currentData.author === data.author) {
        // if current character already a suggestion of current user, delete the character
        return deleteCharacter(editorState);
    }

    const beforeStyle = Highlights.getHighlightStyleAtOffset(editorState, suggestionsTypes, selection, -2);
    const beforeData = Highlights.getHighlightData(editorState, beforeStyle);
    const afterStyle = Highlights.getHighlightStyleAtOffset(editorState, suggestionsTypes, selection, 0);
    const afterData = Highlights.getHighlightData(editorState, afterStyle);
    let newState = Highlights.changeEditorSelection(editorState, -1, 0, false);

    if (beforeData != null && beforeData.type === 'DELETE_SUGGESTION'
        && beforeData.author === data.author) {
        // if previous character is a delete suggestion of the same user, set the same data
        newState = RichUtils.toggleInlineStyle(newState, beforeStyle);
    } else if (afterData != null && afterData.type === 'DELETE_SUGGESTION'
        && afterData.author === data.author) {
        // if next character is a delete suggestion of the same user, set the same data
        newState = RichUtils.toggleInlineStyle(newState, afterStyle);
    } else {
        // create a new suggestion
        newState = Highlights.addHighlight(newState, 'DELETE_SUGGESTION', data);
    }

    return Highlights.changeEditorSelection(newState, 0, -1, true);
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
 * @description For type suggestion reset both style and data for
 * current character position.
 */
const resetSuggestion = (editorState, style) => {
    let newState = editorState;

    newState = Highlights.changeEditorSelection(newState, 0, 1, false);
    newState = Highlights.resetHighlightForCurrentCharacter(newState, style);
    newState = Highlights.changeEditorSelection(newState, 1, 0, false);

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

    newState = Highlights.changeEditorSelection(editorState, -1, 0, false);
    content = newState.getCurrentContent();
    selection = newState.getSelection();

    content = Modifier.removeRange(content, selection, 'forward');
    return EditorState.push(newState, content, 'backspace-character');
};

export default suggestions;
