import {EditorState} from 'draft-js';

export function isSelectionAtEndOfBlock(editorState: EditorState): boolean {
    const selection = editorState.getSelection();
    const endBlockKey = selection.getEndKey();
    const block = editorState.getCurrentContent().getBlockForKey(endBlockKey);

    return block.getLength() === selection.getEndOffset();
}

export function isSelectionAtStartOfBlock(editorState: EditorState): boolean {
    return editorState.getSelection().getStartOffset() === 0;
}
