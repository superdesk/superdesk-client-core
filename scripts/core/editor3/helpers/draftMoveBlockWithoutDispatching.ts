import {SelectionState, AtomicBlockUtils} from "draft-js";

/**
 * Move atomic block and return the state
 *
 * @param {Object} state
 * @param {String} block
 * @param {String} dest
 * @param {String} insertionMode before|after
 * @return {Object}
 */
export function moveBlockWithoutDispatching(state, {block, dest, insertionMode}) {
    const {editorState} = state;
    const contentState = editorState.getCurrentContent();

    switch (true) {
    case block === dest:
    case !contentState.getBlockForKey(dest):
    case !contentState.getBlockForKey(block):
    case dest === contentState.getKeyBefore(block) && insertionMode === 'after':
    case dest === contentState.getKeyAfter(block) && insertionMode === 'before':
    case dest === contentState.getKeyAfter(block) && !insertionMode:
        return state; // noop
    }

    const atomicBlock = contentState.getBlockForKey(block);
    const targetRange = SelectionState.createEmpty(dest);
    const withMovedAtomicBlock = AtomicBlockUtils.moveAtomicBlock(
        editorState,
        atomicBlock,
        targetRange,
        insertionMode,
    );

    return {...state, editorState: withMovedAtomicBlock};
}
