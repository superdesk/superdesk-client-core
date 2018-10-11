import {EditorState, Modifier, SelectionState} from 'draft-js';

/**
 * @ngdoc method
 * @name removeBlock
 * @param {Object} editorState
 * @param {String} blockKey
 * @return {Object} returns new state
 * @description Delete the block with given key.
 */
export const removeBlock = (editorState, blockKey) => {
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(blockKey);

    const targetRange = new SelectionState({
        anchorKey: blockKey,
        anchorOffset: 0,
        focusKey: blockKey,
        focusOffset: block.getLength(),
    });

    let newContentState = Modifier.setBlockType(
        contentState,
        targetRange,
        'unstyled'
    );

    newContentState = Modifier.removeRange(newContentState, targetRange, 'backward');
    return EditorState.push(editorState, newContentState, 'remove-range');
};
