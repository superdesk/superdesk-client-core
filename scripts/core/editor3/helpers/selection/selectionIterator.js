import {EditorState} from 'draft-js';

/**
 * @ngdoc method
 * @name initSelectionIterator
 * @param {Object} editorState
 * @return {Object} returns new state
 * @description Change selection to point at the beginning of existent selection.
 */
export function initSelectionIterator(editorState, backward = false) {
    const selection = editorState.getSelection();
    let newSelection;

    if (backward) {
        newSelection = selection.merge({
            anchorOffset: selection.getEndOffset(),
            anchorKey: selection.getEndKey(),
            focusOffset: selection.getEndOffset(),
            focusKey: selection.getEndKey(),
            isBackward: false,
        });
    } else {
        newSelection = selection.merge({
            anchorOffset: selection.getStartOffset(),
            anchorKey: selection.getStartKey(),
            focusOffset: selection.getStartOffset(),
            focusKey: selection.getStartKey(),
            isBackward: false,
        });
    }

    return EditorState.acceptSelection(editorState, newSelection);
}

/**
 * @ngdoc method
 * @name hasNextSelection
 * @param {Object} editorState
 * @param {Object} selection - the selection to compare with
 * @return {Boolean} returns true if selection has the same end
 * @description Check if the current selection and the received one has the same end/start.
 */
export function hasNextSelection(editorState, selection, backward = false) {
    const crtSelection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const startBlock = content.getBlockForKey(selection.getStartKey());
    const endBlock = content.getBlockForKey(selection.getEndKey());

    if (startBlock == null && backward || endBlock == null && !backward) {
        throw new Error('The following selection is invalid: ', selection);
    }

    if (backward) {
        return selection.getStartOffset() !== crtSelection.getStartOffset() ||
            selection.getStartKey() !== crtSelection.getStartKey();
    } else {
        return selection.getEndOffset() !== crtSelection.getEndOffset() ||
            selection.getEndKey() !== crtSelection.getEndKey();
    }
}
