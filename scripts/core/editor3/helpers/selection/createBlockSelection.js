/**
 * Create a selection that contains the block
 *
 * @param {EditorState} editorState
 * @param {Block} block
 * @returns {SelectionState}
 */
export function createBlockSelection(editorState, block) {
    const selection = editorState.getSelection();

    return selection.merge({
        anchorKey: block.getKey(),
        anchorOffset: 0,
        focusKey: block.getKey(),
        focusOffset: block.getLength(),
        isBackward: false,
    });
}
