function expandRightSingleCursor(
    expandBy,
    boundaryBlockKey,
    boundaryOffset,
    currentBlockKey,
    currentOffset,
    limitedToSingleBlock,
    contentState
) {
    const boundaryViolated = currentBlockKey === boundaryBlockKey && currentOffset + expandBy >= boundaryOffset;

    if (boundaryViolated) {
        return {
            blockKey: boundaryBlockKey,
            offset: boundaryOffset
        };
    }

    // check if resizing can be resolved in the current block

    const currentBlock = contentState.getBlockForKey(currentBlockKey);

    if (currentOffset + expandBy <= currentBlock.getLength()) {
        return {
            blockKey: currentBlockKey,
            offset: currentOffset + expandBy
        };
    }

    // jump to the start of the block after

    const blockAfter = contentState.getBlockAfter(currentBlockKey);

    if (blockAfter === null || blockAfter === undefined || limitedToSingleBlock) {
        return {
            blockKey: currentBlockKey,
            offset: currentBlock.getLength()
        };
    }

    const nextStretchRight = (currentOffset + expandBy) - currentBlock.getLength();
    const nextOffset = 0;
    const nextBlockKey = blockAfter.getKey();

    return expandRightSingleCursor(
        nextStretchRight,
        boundaryBlockKey,
        boundaryOffset,
        nextBlockKey,
        nextOffset,
        limitedToSingleBlock,
        contentState
    );
}

function expandLeftSingleCursor(
    stretchLeft,
    boundaryBlockKey,
    boundaryOffset,
    currentBlockKey,
    currentOffset,
    limitedToSingleBlock,
    contentState
) {
    const boundaryViolated = currentBlockKey === boundaryBlockKey && currentOffset - stretchLeft <= boundaryOffset;

    if (boundaryViolated) {
        return {
            blockKey: boundaryBlockKey,
            offset: boundaryOffset
        };
    }

    // check if resizing can be resolved in the current block

    if (currentOffset - stretchLeft >= 0) {
        return {
            blockKey: currentBlockKey,
            offset: currentOffset - stretchLeft
        };
    }

    // jump to the end of the block before

    const blockBefore = contentState.getBlockBefore(currentBlockKey);

    if (blockBefore === null || blockBefore === undefined || limitedToSingleBlock) {
        return {
            blockKey: currentBlockKey,
            offset: 0
        };
    }

    const nextStretchLeft = stretchLeft - currentOffset;
    const nextOffset = blockBefore.getLength();
    const nextBlockKey = blockBefore.getKey();

    return expandLeftSingleCursor(
        nextStretchLeft,
        boundaryBlockKey,
        boundaryOffset,
        nextBlockKey,
        nextOffset,
        limitedToSingleBlock,
        contentState
    );
}

export function resizeDraftSelection(stretchLeft, stretchRight, selection, editorState, limitedToSingleBlock = false) {
    const contentState = editorState.getCurrentContent();
    const firstBlock = contentState.getFirstBlock();
    const lastBlock = contentState.getLastBlock();

    // shrinking is performed by extending in the opposite direction
    const shrinkLeft = stretchLeft < 0;
    const nextLeft = shrinkLeft
        ? expandRightSingleCursor(
            Math.abs(stretchLeft),
            selection.getEndKey(),
            selection.getEndOffset(),
            selection.getStartKey(),
            selection.getStartOffset(),
            limitedToSingleBlock,
            contentState
        )
        : expandLeftSingleCursor(
            stretchLeft,
            firstBlock.getKey(),
            0,
            selection.getStartKey(),
            selection.getStartOffset(),
            limitedToSingleBlock,
            contentState
        );

    // shrinking is performed by extending in the opposite direction
    const shrinkRight = stretchRight < 0;
    const nextRight = shrinkRight
        ? expandLeftSingleCursor(
            Math.abs(stretchRight),
            nextLeft.blockKey,
            nextLeft.offset,
            selection.getEndKey(),
            selection.getEndOffset(),
            limitedToSingleBlock,
            contentState
        )
        : expandRightSingleCursor(
            stretchRight,
            lastBlock.getKey(),
            lastBlock.getLength(),
            selection.getEndKey(),
            selection.getEndOffset(),
            limitedToSingleBlock,
            contentState
        );

    return selection.merge({
        anchorKey: nextLeft.blockKey,
        focusKey: nextRight.blockKey,
        anchorOffset: selection.getIsBackward() ? nextRight.offset : nextLeft.offset,
        focusOffset: selection.getIsBackward() ? nextLeft.offset : nextRight.offset
    });
}