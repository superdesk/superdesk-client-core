import {EditorState} from 'draft-js';
import {repositionComments, redrawComments} from '.';

/**
 * @typedef StateWithComment
 * @property {ContentState} contentState The new content state with styling applied.
 * @property {Comment} activeComment The active comment.
 */

/**
 * @name updateComments
 * @description Returns a new editor state, along with the active comment if one is
 * hovered. The new editor state will contain the updated comment offsets, based on
 * the difference between the oldState and the newState.
 * @param {EditorState} oldState
 * @param {EditorState} newState
 * @returns {StateWithComment}
 */
export function updateComments(oldState, newState) {
    const selectionBefore = newState.getCurrentContent().getSelectionBefore();
    const selectionAfter = newState.getCurrentContent().getSelectionAfter();

    let updatedState = repositionComments(oldState, newState);
    let {editorState, activeComment} = redrawComments(oldState, updatedState);

    if (changedContent(newState)) {
        // Preserve before & after selection when content was changed. This helps
        // with keeping the cursor more or less in the same position when undo-ing
        // and redo-ing. Without this, all of the recalculating of offsets and styles
        // will misplace the cursor position.
        editorState = EditorState.set(editorState, {allowUndo: false});
        editorState = EditorState.push(editorState, editorState.getCurrentContent()
            .set('selectionBefore', selectionBefore)
            .set('selectionAfter', selectionAfter)
        );
        editorState = EditorState.set(editorState, {allowUndo: true});
    }

    return {editorState, activeComment};
}

/**
 * @name changedContent
 * @description True if the last change affected the content.
 * @returns {Boolean}
 */
const changedContent = (editorState) => [
    'backspace-character', 'delete-character', 'insert-characters',
    'remove-range', 'insert-fragment', 'undo', 'redo', 'split-block'
].indexOf(editorState.getLastChangeType()) > -1;
