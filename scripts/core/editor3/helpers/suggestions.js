import {EditorState} from 'draft-js';
import * as Highlights from './highlights';
import {suggestionsTypes} from '../highlightsConfig';
import {initSelectionIterator, hasNextSelection} from '../helpers/selection';

/**
 * @ngdoc method
 * @name allowEditSuggestionOnLeft
 * @param {Object} editor state
 * @param {String} author
 * @returns {Boolean} True if on current text there are no noneditable suggestion on the left.
 * @description Check if the current text don't contain a noneditable suggestion on the right.
 */
export function allowEditSuggestionOnLeft(editorState, author) {
    return allowEditSuggestion(editorState, author, true);
}

/**
 * @ngdoc method
 * @name allowEditSuggestionOnRight
 * @param {Object} editor state
 * @param {String} author
 * @returns {Boolean} True if on current text there are no noneditable suggestion on the right.
 * @description Check if the current text don't contain a noneditable suggestion on the right.
 */
export function allowEditSuggestionOnRight(editorState, author) {
    return allowEditSuggestion(editorState, author, false);
}

/**
 * @ngdoc method
 * @name allowEditSuggestionOnBlock
 * @param {Object} editor state
 * @param {String} author
 * @returns {Boolean} True if on current block(s) there are no noneditable suggestions.
 * @description Check if the current block(s) don't contain a noneditable suggestion.
 */
export function allowEditSuggestionOnBlock(editorState, author) {
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selection.getEndKey());
    const newSelection = selection.merge({
        anchorOffset: 0,
        anchorKey: selection.getStartKey(),
        focusOffset: block.getLength(),
        focusKey: selection.getEndKey(),
        isBackward: true,
    });
    const newEditorState = EditorState.forceSelection(editorState, newSelection);

    return allowEditSuggestionOnLeft(newEditorState, author);
}

/**
 * @ngdoc method
 * @name allowEditSuggestion
 * @param {Object} editor state
 * @param {String} author
 * @param {boolean} isBackward
 * @returns {Boolean} True if the current text don't contains a noneditable suggestion.
 * @description Check if the current text don't contain a noneditable suggestion.
 */
const allowEditSuggestion = (editorState, author, isBackward) => {
    const selection = editorState.getSelection();
    let newEditorState;
    let tmpEditorState;

    if (!selection.isCollapsed()) {
        newEditorState = initSelectionIterator(editorState);
        while (hasNextSelection(newEditorState, selection)) {
            const data = Highlights.getHighlightDataAtCurrentPosition(
                newEditorState, suggestionsTypes);

            if (!allowEditForData(data, author, false)) {
                return false;
            }

            tmpEditorState = Highlights.changeEditorSelection(newEditorState, 1, 1, false);
            if (tmpEditorState === newEditorState) {
                break;
            }
            newEditorState = tmpEditorState;
        }

        const styleBefore = Highlights.getHighlightStyleAtOffset(editorState, suggestionsTypes, selection, -1);
        const styleAfter = Highlights.getHighlightStyleAtOffset(editorState, suggestionsTypes, selection, 0, true);

        if (styleBefore != null && styleAfter != null && styleBefore === styleAfter) {
            return false;
        }
    }

    if (isBackward) {
        const dataBefore = Highlights.getHighlightDataAtOffset(editorState, suggestionsTypes, selection, -1);

        return allowEditForData(dataBefore, author);
    }

    const dataAfter = Highlights.getHighlightDataAtOffset(editorState, suggestionsTypes, selection, 0, true);

    return allowEditForData(dataAfter, author);
};

// Check if the current allow the edit.
const allowEditForData = (data, author, checkDelete = true) => {
    if (data == null) {
        return true;
    }

    const allow = (!checkDelete || data.type !== 'DELETE_SUGGESTION');

    return author === data.author && allow;
};
