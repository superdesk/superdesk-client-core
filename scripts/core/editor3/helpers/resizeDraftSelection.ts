import {getBlockAndOffset} from '../helpers/highlights';

export function resizeDraftSelection(stretchLeft, stretchRight, selection, editorState, limitedToSingleBlock = false) {
    const nextLeft = getBlockAndOffset(editorState, selection, -stretchLeft, false, limitedToSingleBlock);
    const nextRight = getBlockAndOffset(editorState, selection, stretchRight, true, limitedToSingleBlock);

    const nextLeftOffset = nextLeft.newOffset == null ? selection.getStartOffset() : nextLeft.newOffset;
    const nextRightOffset = nextRight.newOffset == null ? selection.getEndOffset() : nextRight.newOffset;

    const nextRightBlockKey = nextRight.block == null ? selection.getEndKey() : nextRight.block.getKey();
    const nextLeftBlockKey = nextLeft.block == null ? selection.getStartKey() : nextLeft.block.getKey();

    return selection.merge({
        anchorKey: selection.getIsBackward() ? nextRightBlockKey : nextLeftBlockKey,
        focusKey: selection.getIsBackward() ? nextLeftBlockKey : nextRightBlockKey,
        anchorOffset: selection.getIsBackward() ? nextRightOffset : nextLeftOffset,
        focusOffset: selection.getIsBackward() ? nextLeftOffset : nextRightOffset,
    });
}