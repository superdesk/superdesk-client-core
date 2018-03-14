function mergeSelectionLeft(selectionState, left) {
    if (selectionState.getIsBackward()) {
        return selectionState.merge({
            focusOffset: left,
        });
    } else {
        return selectionState.merge({
            anchorOffset: left,
        });
    }
}

function mergeSelectionRight(selectionState, right) {
    if (selectionState.getIsBackward()) {
        return selectionState.merge({
            anchorOffset: right,
        });
    } else {
        return selectionState.merge({
            focusOffset: right,
        });
    }
}

function expandLeft(selectionState, editorState, stretchLeft, limitedToSingleBlock) {
    const contentState = editorState.getCurrentContent();
    const startOffset = selectionState.getStartOffset();
    const nextLeft = startOffset - stretchLeft;
    const minLeft = 0;

    if (nextLeft >= minLeft) {
        return mergeSelectionLeft(selectionState, nextLeft);
    }

    const blockKey = selectionState.getStartKey();
    const blockBefore = contentState.getBlockBefore(blockKey);

    if (blockBefore === null || blockBefore === undefined || limitedToSingleBlock) {
        return mergeSelectionLeft(selectionState, minLeft);
    }

    var mergeBlockKey = selectionState.merge({
        anchorKey: blockBefore.getKey(),
    });

    const nextSelectionOnPreviousBlock = mergeSelectionLeft(mergeBlockKey, blockBefore.getLength());

    return expandLeft(nextSelectionOnPreviousBlock, editorState, stretchLeft - nextLeft);
}

function expandRight(selectionState, editorState, stretchRight, limitedToSingleBlock) {
    const contentState = editorState.getCurrentContent();
    const endOffset = selectionState.getEndOffset();

    const blockKey = selectionState.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const maxRight = block.getLength();
    const nextRight = endOffset + stretchRight;

    if (nextRight <= maxRight) {
        return mergeSelectionRight(selectionState, nextRight);
    }

    const blockAfter = contentState.getBlockAfter(blockKey);

    if (blockAfter === null || blockAfter === undefined || limitedToSingleBlock) {
        return mergeSelectionRight(selectionState, maxRight);
    }

    var mergeBlockKey = selectionState.merge({
        focusKey: blockAfter.getKey(),
    });

    const nextSelectionOnNextBlock = mergeSelectionRight(mergeBlockKey, 0);

    return expandRight(nextSelectionOnNextBlock, editorState, stretchRight - nextRight);
}

export function resizeDraftSelection(selection, editorState, stretchLeft, stretchRight, limitedToSingleBlock) {
    const expandedLeft = expandLeft(selection, editorState, stretchLeft, limitedToSingleBlock);

    return expandRight(expandedLeft, editorState, stretchRight, limitedToSingleBlock);
}