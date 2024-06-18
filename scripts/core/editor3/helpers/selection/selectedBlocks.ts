import {getBlockKeys_deprecated} from '.';

export const getSelectedBlocks = (editorState) => {
    const selectionState = editorState.getSelection();

    return getBlockKeys_deprecated(
        editorState.getCurrentContent(),
        selectionState.getStartKey(),
        selectionState.getEndKey(),
    );
};
