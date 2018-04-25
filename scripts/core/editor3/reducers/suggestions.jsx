import {EditorState, Modifier, RichUtils, SelectionState} from 'draft-js';
import {onChange} from './editor3';
import {acceptedInlineStyles} from '../helpers/inlineStyles';
import {changeSuggestionsTypes, styleSuggestionsTypes} from '../highlightsConfig';
import * as Highlights from '../helpers/highlights';
import {initSelectionIterator, hasNextSelection} from '../helpers/selection';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor} from '../helpers/editor3CustomData';
import * as Blocks from '../helpers/blocks';
import * as Links from '../helpers/links';
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
    case 'CREATE_CHANGE_BLOCK_STYLE_SUGGESTION':
        return createChangeBlockStyleSuggestion(state, action.payload);
    case 'CREATE_SPLIT_PARAGRAPH_SUGGESTION':
        return createSplitParagraphSuggestion(state, action.payload);
    case 'PASTE_ADD_SUGGESTION':
        return pasteAddSuggestion(state, action.payload);
    case 'CREATE_LINK_SUGGESTION':
        return createLinkSuggestion(state, action.payload);
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
        suggestingMode: !suggestingMode,
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
    const inlineStyle = editorState.getCurrentInlineStyle();

    editorState = deleteCurrentSelection(editorState, data);

    for (let i = 0; i < text.length; i++) {
        // for every character from inserted text apply add suggestion
        editorState = setAddSuggestionForCharacter(editorState, data, text[i], inlineStyle);
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

    if (selection.isCollapsed()) {
        if (action === 'backspace') {
            editorState = Highlights.changeEditorSelection(editorState, -1, 0, false);
        } else {
            editorState = Highlights.changeEditorSelection(editorState, 0, 1, false);
        }
    }

    editorState = deleteCurrentSelection(editorState, data);

    if (selection.isCollapsed() && action !== 'backspace') {
        editorState = Highlights.changeEditorSelection(editorState, 1, 1, false);
    }

    return saveEditorStatus(state, editorState, 'change-inline-style');
};

/**
 * @ngdoc method
 * @name createAddSuggestion
 * @param {Object} state
 * @param {String} style - the suggestion style
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type ADD.
 */
const createChangeStyleSuggestion = (state, {style, data}) => {
    let {editorState} = state;
    const type = Highlights.getTypeByInlineStyle(style);

    editorState = applyStyleSuggestion(editorState, type, style, data);
    editorState = RichUtils.toggleInlineStyle(editorState, style);

    return saveEditorStatus(state, editorState, 'change-inline-style', true);
};

function applyStyleSuggestion(editorState, type, style, data) {
    const selection = editorState.getSelection();
    let newEditorState = editorState;
    let tmpEditorState;
    let currentStyle;
    let changeStyle = true;

    newEditorState = initSelectionIterator(newEditorState);
    while (hasNextSelection(newEditorState, selection)) {
        currentStyle = Highlights.getHighlightStyleAtCurrentPosition(newEditorState, type);

        if (currentStyle) {
            tmpEditorState = resetSuggestion(newEditorState, currentStyle);
        } else {
            changeStyle = false;
            tmpEditorState = Highlights.changeEditorSelection(newEditorState, 1, 1, false);
        }

        if (tmpEditorState === newEditorState) {
            break;
        }
        newEditorState = tmpEditorState;
    }

    if (changeStyle && currentStyle != null) {
        const oldData = Highlights.getHighlightData(editorState, currentStyle);

        if (oldData.originalStyle === style && data.originalStyle === '' ||
            oldData.originalStyle === '' && data.originalStyle === style) {
            // the style is toggled back, so no suggestion is added
            return newEditorState;
        } else {
            data.originalStyle = oldData.originalStyle;
        }
    }

    newEditorState = EditorState.acceptSelection(newEditorState, selection);
    newEditorState = Highlights.addHighlight(newEditorState, type, data);

    return newEditorState;
}

/**
 * @ngdoc method
 * @name createLinkSuggestion
 * @param {Object} state
 * @param {Object} data - info about the suggestion (includes link object)
 * @return {Object} returns new state
 * @description Add a new suggestion of type ADD link to text
 */
const createLinkSuggestion = (state, {data}) => {
    const {editorState} = state;
    const stateWithLink = Links.createLink(editorState, data.link);
    const newState = Highlights.addHighlight(stateWithLink, 'ADD_LINK_SUGGESTION', data);

    return saveEditorStatus(state, newState, 'apply-entity');
};

/**
 * @ngdoc method
 * @name createChangeBlockStyleSuggestion
 * @param {Object} state
 * @param {String} blockType - the suggestion block type
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type change block style.
 */
const createChangeBlockStyleSuggestion = (state, {blockType, data}) => {
    let {editorState} = state;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const firstBlock = content.getBlockForKey(selection.getStartKey());
    let lastBlock = content.getBlockForKey(selection.getEndKey());

    if (selection.getEndOffset() === 0 && selection.getStartKey() !== selection.getEndKey()) {
        lastBlock = content.getBlockBefore(selection.getEndKey());
    }

    const blocksSelection = selection.merge({
        anchorOffset: 0,
        anchorKey: firstBlock.getKey(),
        focusOffset: lastBlock.getLength(),
        focusKey: lastBlock.getKey(),
        isBackward: false,
    });
    const type = 'BLOCK_STYLE_SUGGESTION';
    const newData = {
        ...data,
        blockType,
    };

    editorState = EditorState.acceptSelection(editorState, blocksSelection);
    editorState = applyStyleSuggestion(editorState, type, blockType, newData);
    editorState = RichUtils.toggleBlockType(editorState, blockType);

    return saveEditorStatus(state, editorState, 'change-block-type', true);
};

/**
 * Sanitize given content state on paste
 *
 * @param {ContentState} content
 * @returns {ContentState}
 */
function sanitizeContent(content) {
    let output = content;

    const ignoreStyle = (style) => acceptedInlineStyles.indexOf(style) === -1;
    const getSelection = (block, start, end) => SelectionState.createEmpty(block.getKey()).merge({
        anchorOffset: start,
        focusOffset: end,
    });

    content.getBlockMap().forEach((block) => {
        // remove extra styles
        block.findStyleRanges(
            (character) => character.getStyle().some(ignoreStyle),
            (start, end) => {
                const selection = getSelection(block, start, end);
                const inlineStyle = block.getInlineStyleAt(start).find(ignoreStyle);

                output = Modifier.removeInlineStyle(output, selection, inlineStyle);
            }
        );

        // remove any entities
        block.findEntityRanges(
            () => true,
            (start, end) => {
                const selection = getSelection(block, start, end);

                output = Modifier.applyEntity(output, selection, null);
            }
        );
    });

    return output;
}

/**
 * @ngdoc method
 * @name createSplitParagraphSuggestion
 * @param {Object} state
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type split block.
 */
const createSplitParagraphSuggestion = (state, {data}) => {
    let {editorState} = state;
    let content = editorState.getCurrentContent();
    const selection = editorState.getSelection();

    content = Modifier.splitBlock(content, selection);
    const type = 'SPLIT_PARAGRAPH_SUGGESTION';
    const block = content.getBlockAfter(selection.getStartKey());
    let blockSelection = selection.merge({
        anchorOffset: 0,
        anchorKey: block.getKey(),
        focusOffset: block.getLength(),
        focusKey: block.getKey(),
        isBackward: false,
    });

    editorState = EditorState.push(editorState, content, 'split-block');
    editorState = EditorState.acceptSelection(editorState, blockSelection);
    editorState = applyStyleSuggestion(editorState, type, data);

    blockSelection = blockSelection.merge({
        focusOffset: 0,
    });
    editorState = EditorState.acceptSelection(editorState, blockSelection);

    return saveEditorStatus(state, editorState, 'change-inline-style', false);
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
    const initialSelection = editorState.getSelection();

    const beforeStyle = Highlights.getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, initialSelection, -1);
    const beforeData = beforeStyle != null ? Highlights.getHighlightData(editorState, beforeStyle) : null;

    // add content to editor state
    const mergedContent = Modifier.replaceWithFragment(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        sanitizeContent(content).getBlockMap()
    );

    // push new content
    editorState = EditorState.push(editorState, mergedContent, 'insert-fragment');

    // store current selection for later
    const finalSelection = editorState.getSelection();

    // select pasted content
    editorState = EditorState.acceptSelection(editorState, editorState.getSelection().merge(
        initialSelection.isBackward ? {
            isBackward: true,
            anchorKey: finalSelection.anchorKey,
            anchorOffset: finalSelection.anchorOffset,
            focusKey: initialSelection.focusKey,
            focusOffset: initialSelection.focusOffset,
        } : {
            anchorKey: initialSelection.anchorKey,
            anchorOffset: initialSelection.anchorOffset,
        }
    ));

    // apply highlights
    if (beforeData != null && beforeData.type === 'ADD_SUGGESTION' && beforeData.author === data.author) {
        editorState = RichUtils.toggleInlineStyle(editorState, beforeStyle);
    } else {
        editorState = Highlights.addHighlight(editorState, 'ADD_SUGGESTION', data);
    }

    // reset selection
    editorState = EditorState.forceSelection(editorState, finalSelection);

    return saveEditorStatus(state, editorState, 'change-block-type');
};

/**
 * @ngdoc method
 * @name moveToSuggestionsHistory
 * @param {Object} editorState
 * @param {Object} suggestion
 * @param {Boolean} accepted
 * @return {editorState} returns new state
 */
function moveToSuggestionsHistory(editorState, suggestion, accepted) {
    const resolvedSuggestions = getCustomDataFromEditor(
        editorState,
        editor3DataKeys.RESOLVED_SUGGESTIONS_HISTORY
    ) || [];

    let nextEditorState = editorState;

    nextEditorState = setCustomDataForEditor(
        editorState,
        editor3DataKeys.RESOLVED_SUGGESTIONS_HISTORY,
        resolvedSuggestions.concat({
            suggestionText: suggestion.suggestionText,
            oldText: suggestion.oldText,
            suggestionInfo: {
                ...suggestion,
            },
            resolutionInfo: {
                resolverUserId: ng.get('session').identity._id,
                date: new Date(),
                accepted: accepted,
            },
        })
    );

    nextEditorState = Highlights.removeHighlight(nextEditorState, suggestion.styleName);

    return nextEditorState;
}

/**
 * @ngdoc method
 * @name processSplitSuggestion
 * @param {Object} state
 * @param {Object} suggestion
 * @param {Boolean} accepted - the suggestion is accepted
 * @return {Object} returns new state
 * @description Accept or reject the split suggestions in the selection.
 */
const processSplitSuggestion = (state, suggestion, accepted) => {
    const {selection} = suggestion;
    let {editorState} = state;

    editorState = moveToSuggestionsHistory(editorState, suggestion, accepted);
    if (!accepted) {
        let content = editorState.getCurrentContent();
        let block = content.getBlockBefore(selection.getStartKey());
        let newSelection = selection.merge({
            anchorOffset: 0,
            anchorKey: selection.getStartKey(),
            focusOffset: block.getLength(),
            focusKey: block.getKey(),
            isBackward: true,
        });

        content = Modifier.removeRange(content, newSelection, 'backward');
        editorState = EditorState.push(editorState, content, 'remove-range');
    }

    return saveEditorStatus(state, editorState, 'change-inline-style', false);
};

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
    let tmpEditorState;
    let style;
    let data;

    if (suggestion.type === 'SPLIT_PARAGRAPH_SUGGESTION') {
        return processSplitSuggestion(state, suggestion, accepted);
    }

    // If link it's rejected we remove the entity
    if (suggestion.type === 'ADD_LINK_SUGGESTION' && !accepted) {
        editorState = Links.removeLink(editorState);
    }

    editorState = EditorState.acceptSelection(editorState, selection);

    if (suggestion.type === 'BLOCK_STYLE_SUGGESTION') {
        editorState = moveToSuggestionsHistory(editorState, suggestion, accepted);
        if (!accepted) {
            editorState = RichUtils.toggleBlockType(editorState, suggestion.blockType);
        }

        return saveEditorStatus(state, editorState, 'change-inline-style', true);
    }

    if (styleSuggestionsTypes.indexOf(suggestion.type) !== -1) {
        editorState = moveToSuggestionsHistory(editorState, suggestion, accepted);
        if (!accepted) {
            style = Highlights.getInlineStyleByType(suggestion.type);
            editorState = RichUtils.toggleInlineStyle(editorState, style);
        }

        return saveEditorStatus(state, editorState, 'change-inline-style', true);
    }

    editorState = initSelectionIterator(editorState, true);
    while (hasNextSelection(editorState, selection, true)) {
        editorState = Highlights.changeEditorSelection(editorState, -1, -1, false);
        style = Highlights.getHighlightStyleAtCurrentPosition(editorState, changeSuggestionsTypes);
        if (style == null) {
            continue;
        }
        data = Highlights.getHighlightData(editorState, style);

        const applySuggestion = data.type === 'ADD_SUGGESTION' && accepted ||
            data.type === 'DELETE_SUGGESTION' && !accepted;

        if (applySuggestion) {
            // keep character and clean suggestion style and entity
            tmpEditorState = resetSuggestion(editorState, style);
            tmpEditorState = Highlights.changeEditorSelection(tmpEditorState, -1, -1, false);
        } else {
            // delete current character
            tmpEditorState = Highlights.changeEditorSelection(editorState, 1, 1, false);
            tmpEditorState = deleteCharacter(tmpEditorState);
        }

        if (tmpEditorState === editorState) {
            break;
        }
        editorState = tmpEditorState;
    }

    editorState = moveToSuggestionsHistory(editorState, suggestion, accepted);

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
    let newEditorState = editorState;
    let tmpEditorState;

    newEditorState = initSelectionIterator(newEditorState, backward);

    while (hasNextSelection(newEditorState, selection, backward)) {
        tmpEditorState = setDeleteSuggestionForCharacter(newEditorState, data);
        if (tmpEditorState === newEditorState) {
            break;
        }
        newEditorState = tmpEditorState;
    }

    return newEditorState;
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
    const beforeStyle = Highlights.getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, selection, -1);
    const beforeData = beforeStyle != null ? Highlights.getHighlightData(editorState, beforeStyle) : null;
    const currentStyle = Highlights.getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, selection, 0);
    const currentData = currentStyle != null ? Highlights.getHighlightData(editorState, currentStyle) : null;
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
        newState = applyStylesForCurrentSelection(newState, crtInlineStyle);
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
    const currentStyle = Highlights.getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, selection, -1);
    const currentData = currentStyle != null ? Highlights.getHighlightData(editorState, currentStyle) : null;

    if (currentData != null && currentData.type === 'DELETE_SUGGESTION') {
        // if current character is already marked as a delete suggestion, skip
        return Highlights.changeEditorSelection(editorState, -1, -1, true);
    }

    if (currentData != null && currentData.type === 'ADD_SUGGESTION' &&
        currentData.author === data.author) {
        // if current character already a suggestion of current user, delete the character
        return deleteCharacter(editorState, currentStyle);
    }

    const beforeStyle = Highlights.getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, selection, -2);
    const beforeData = beforeStyle != null ? Highlights.getHighlightData(editorState, beforeStyle) : null;
    const afterStyle = Highlights.getHighlightStyleAtOffset(editorState, changeSuggestionsTypes, selection, 0);
    const afterData = afterStyle != null ? Highlights.getHighlightData(editorState, afterStyle) : null;
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
 * @name applyStylesForCurrentSelection
 * @param {Object} editorState
 * @param {Objest} inlineStyle
 * @return {Object} returns new state
 * @description Apply only formatting styles from inlineStyle for current selection.
 */
const applyStylesForCurrentSelection = (editorState, inlineStyle) => {
    let newState = editorState;

    inlineStyle.filter((style) => acceptedInlineStyles.indexOf(style) !== -1)
        .forEach((style) => {
            newState = RichUtils.toggleInlineStyle(newState, style);
        });

    return newState;
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
 * @param {String} style - style of the current selection (optional)
 * @return {Object} returns new state
 * @description Delete the current character.
 */
const deleteCharacter = (editorState, style = null) => {
    let newState = Highlights.changeEditorSelection(editorState, -1, 0, false);
    let content = newState.getCurrentContent();
    const selection = newState.getSelection();
    const block = content.getBlockForKey(selection.getStartKey());

    if (block.getLength() === 1) {
        // when only one character on block, delete the whole block
        return Blocks.removeBlock(editorState, block.getKey());
    }

    content = Modifier.removeRange(content, selection, 'forward');

    newState = EditorState.push(newState, content, 'backspace-character');

    if (style) {
        const textForHighlight = Highlights.getRangeAndTextForStyle(newState, style);

        if (textForHighlight.highlightedText === '') {
            // also delete the suggestion if it was the last character of that suggestion
            newState = Highlights.removeHighlight(newState, style);
        }
    }

    return newState;
};

export default suggestions;
