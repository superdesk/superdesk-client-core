import {getBlockKeys} from '.';

export const getSelectedBlocks = (editorState) => {
    const selectionState = editorState.getSelection();

    return getBlockKeys(
        editorState.getCurrentContent(),
        selectionState.getStartKey(),
        selectionState.getEndKey()
    );
};
