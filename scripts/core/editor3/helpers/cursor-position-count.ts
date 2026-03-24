import {EditorState} from 'draft-js';

// These functions count raw block characters to reflect actual cursor positions
// in the editor. This intentionally differs from getEditorFieldCharactersCount
// which trims whitespace for character limit validation. Trimming here would
// cause reported positions to not match the visible cursor location.

/**
 * Returns the total number of characters before the cursor position
 * by summing the length of all blocks preceding the cursor's block,
 * plus the offset within that block.
 */
export function getCharsBeforeCursor(editorState: EditorState): number {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const cursorKey = selection.getStartKey();
    const cursorOffset = selection.getStartOffset();
    const blocks = contentState.getBlocksAsArray();

    let count = 0;

    for (const block of blocks) {
        if (block.getKey() === cursorKey) {
            count += cursorOffset;
            break;
        }

        count += block.getLength();
    }

    return count;
}

/**
 * Returns the number of characters in the current selection range.
 * Handles both single-block and multi-block selections.
 */
export function getSelectedCharsCount(editorState: EditorState): number {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const startKey = selection.getStartKey();
    const endKey = selection.getEndKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();

    if (startKey === endKey) {
        return endOffset - startOffset;
    }

    const blocks = contentState.getBlocksAsArray();
    let count = 0;
    let inRange = false;

    for (const block of blocks) {
        const key = block.getKey();

        if (key === startKey) {
            count += block.getLength() - startOffset;
            inRange = true;
        } else if (key === endKey) {
            count += endOffset;
            break;
        } else if (inRange) {
            count += block.getLength();
        }
    }

    return count;
}
