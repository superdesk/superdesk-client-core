import {EditorState} from 'draft-js';
import * as Highlights from './highlights';
import {suggestionsTypes} from '../highlightsConfig';
import {initSelectionIterator, hasNextSelection} from '../helpers/selectionIterator';
import ng from 'core/services/ng';

/**
 * @ngdoc method
 * @name allowEditSuggestionOnLeft
 * @param {Object} editor state
 * @returns {Boolean} True if on current text there are no noneditable suggestion on the left.
 * @description Check if the current text don't contain a noneditable suggestion on the right.
 */
export function allowEditSuggestionOnLeft(editorState) {
    return allowEditSuggestion(editorState, true);
}

/**
 * @ngdoc method
 * @name allowEditSuggestionOnRight
 * @param {Object} editor state
 * @returns {Boolean} True if on current text there are no noneditable suggestion on the right.
 * @description Check if the current text don't contain a noneditable suggestion on the right.
 */
export function allowEditSuggestionOnRight(editorState) {
    return allowEditSuggestion(editorState, false);
}

/**
 * @ngdoc method
 * @name allowEditSuggestionOnBlock
 * @param {Object} editor state
 * @returns {Boolean} True if on current block(s) there are no noneditable suggestions.
 * @description Check if the current block(s) don't contain a noneditable suggestion.
 */
export function allowEditSuggestionOnBlock(editorState) {
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

    return allowEditSuggestionOnLeft(newEditorState);
}

/**
 * @ngdoc method
 * @name allowEditSuggestion
 * @param {Object} editor state
 * @param {boolean} isBackward
 * @returns {Boolean} True if the current text don't contains a noneditable suggestion.
 * @description Check if the current text don't contain a noneditable suggestion.
 */
const allowEditSuggestion = (editorState, isBackward) => {
    const selection = editorState.getSelection();
    let newEditorState;
    let tmpEditorState;

    if (!selection.isCollapsed()) {
        newEditorState = initSelectionIterator(editorState);
        while (hasNextSelection(newEditorState, selection)) {
            const data = Highlights.getHighlightDataAtCurrentPosition(
                newEditorState, suggestionsTypes);

            if (!allowEditForData(data)) {
                return false;
            }

            tmpEditorState = Highlights.changeEditorSelection(newEditorState, 1, 1, false);
            if (tmpEditorState === newEditorState) {
                break;
            }
            newEditorState = tmpEditorState;
        }

        return true;
    }

    if (isBackward) {
        const dataBefore = Highlights.getHighlightDataAtOffset(editorState, suggestionsTypes, selection, -1);

        return allowEditForData(dataBefore);
    }

    const dataAfter = Highlights.getHighlightDataAtOffset(editorState, suggestionsTypes, selection, 0);

    return allowEditForData(dataAfter);
};

// Check if the current allow the edit.
const allowEditForData = (data) => {
    if (data == null) {
        return true;
    }

    const user = ng.get('session').identity._id;
    const author = data.author;

    return author === user;
};
