import {
    SelectionState
} from 'draft-js';


export function getDraftSelectionForEntireContent(editorState) {
    const contentState = editorState.getCurrentContent();

    return new SelectionState({
        anchorKey: contentState.getFirstBlock().getKey(),
        anchorOffset: 0,
        focusKey: contentState.getLastBlock().getKey(),
        focusOffset: contentState.getLastBlock().getLength(),
        isBackward: false
    });
}