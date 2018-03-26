import {getBlockAndOffset} from '../helpers/highlights';

export function resizeDraftSelection(stretchLeft, stretchRight, selection, editorState, limitedToSingleBlock = false) {
    const nextLeft = getBlockAndOffset(editorState, selection, -stretchLeft, false, limitedToSingleBlock);
    const nextRight = getBlockAndOffset(editorState, selection, stretchRight, true, limitedToSingleBlock);

    return selection.merge({
        anchorKey: nextLeft.block.getKey(),
        focusKey: nextRight.block.getKey(),
        anchorOffset: selection.getIsBackward() ? nextRight.offset : nextLeft.newOffset,
        focusOffset: selection.getIsBackward() ? nextLeft.offset : nextRight.newOffset
    });
}