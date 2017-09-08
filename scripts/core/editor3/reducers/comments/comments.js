import {EditorState} from 'draft-js';
import {repositionComments, redrawComments} from '.';

/**
 * @typedef StateWithComment
 * @property {ContentState} editorState
 * @property {Comment} activeComment
 */

/**
 * @name updateComments
 * @description updateComments updates comment information after every content change. It
 * recalculates comment offsets (start and end points) and reapplies the inline styling to
 * match these.
 * @param {EditorState} oldState
 * @param {EditorState} newState
 * @returns {StateWithComment}
 */
export function updateComments(oldState, newState) {
    let updatedState = repositionComments(oldState, newState);
    let {editorState, activeComment} = redrawComments(updatedState);
    let contentChanged = oldState.getCurrentContent() !== newState.getCurrentContent();

    if (contentChanged) {
        editorState = preserveSelection(editorState, newState.getCurrentContent());
    }

    return {editorState, activeComment};
}

// Preserve before & after selection when content was changed. This helps
// with keeping the cursor more or less in the same position when undo-ing
// and redo-ing. Without this, all of the recalculating of offsets and styles
// will misplace the cursor position when the user performs an Undo operation.
function preserveSelection(es, content) {
    let editorState = es;
    let selectionBefore = content.getSelectionBefore();
    let selectionAfter = content.getSelectionAfter();

    editorState = EditorState.set(editorState, {allowUndo: false});
    editorState = EditorState.push(editorState, editorState.getCurrentContent()
        .set('selectionBefore', selectionBefore)
        .set('selectionAfter', selectionAfter)
    );

    return EditorState.set(editorState, {allowUndo: true});
}
