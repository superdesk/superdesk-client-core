import {EditorState} from 'draft-js';
import {repositionHighlights, redrawHighlights} from '.';

/**
 * @typedef StateWithComment
 * @property {ContentState} editorState
 * @property {Comment} activeHighlights
 */

/**
 * @name updateHighlights
 * @description Updates highlight information after every content change. It
 * recalculates offsets (start and end points) and reapplies the inline styling to
 * match these.
 * @param {EditorState} oldState
 * @param {EditorState} newState
 * @returns {StateWithComment}
 */
export function updateHighlights(oldState, newState) {
    let updatedState = repositionHighlights(oldState, newState);
    let {editorState, activeHighlights} = redrawHighlights(updatedState);
    let contentChanged = oldState.getCurrentContent() !== newState.getCurrentContent();

    if (contentChanged) {
        editorState = preserveSelection(editorState, newState.getCurrentContent());
    }

    return {editorState, activeHighlights};
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
