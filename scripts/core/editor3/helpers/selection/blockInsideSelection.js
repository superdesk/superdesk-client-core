import {getSelectedBlocks} from './';

export const blockInsideSelection = (editorState, key) =>
    getSelectedBlocks(editorState)
        .includes(key);
