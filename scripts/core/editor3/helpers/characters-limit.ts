import {
    EditorState,
    Modifier,
    SelectionState,
    DraftEditorCommand,
    RichUtils,
} from 'draft-js';

export const LIMIT_CHARACTERS_OVERFLOW_STYLE = 'LIMIT_CHARACTERS_OVERFLOW';

export function preventInputWhenLimitIsPassed(
    editorState: EditorState,
    newChars: string,
    limit: number,
) {
    const length =
        editorState.getCurrentContent().getPlainText().length +
        newChars.length -
        getLengthOfSelectedText(editorState);
    const overflow = length - limit;

    return overflow > 0;
}

function getLengthOfSelectedText(editorState: EditorState) {
    const currentSelection = editorState.getSelection();
    const isCollapsed = currentSelection.isCollapsed();

    if (isCollapsed) {
        return 0;
    }

    let length = 0;
    const currentContent = editorState.getCurrentContent();
    const startKey = currentSelection.getStartKey();
    const endKey = currentSelection.getEndKey();
    const startBlock = currentContent.getBlockForKey(startKey);
    const blocksAreTheSame = startKey === endKey;
    const startBlockTextLength = startBlock.getLength();
    const startSelectedTextLength =
        startBlockTextLength - currentSelection.getStartOffset();
    const endSelectedTextLength = currentSelection.getEndOffset();
    const keyAfterEnd = currentContent.getKeyAfter(endKey);

    if (blocksAreTheSame) {
        length +=
            currentSelection.getEndOffset() - currentSelection.getStartOffset();
    } else {
        let currentKey = startKey;

        while (currentKey && currentKey !== keyAfterEnd) {
            if (currentKey === startKey) {
                length += startSelectedTextLength + 1;
            } else if (currentKey === endKey) {
                length += endSelectedTextLength;
            } else {
                length +=
                    currentContent.getBlockForKey(currentKey).getLength() + 1;
            }

            currentKey = currentContent.getKeyAfter(currentKey);
        }
    }

    return length;
}

function clearOverflowInlineStyles(editorState: EditorState) {
    const blockMap = editorState.getCurrentContent().getBlockMap();

    // clear inline style from all text
    let newContentState = Modifier.removeInlineStyle(
        editorState.getCurrentContent(),
        new SelectionState({
            anchorKey: blockMap.first().getKey(),
            anchorOffset: 0,
            focusKey: blockMap.last().getKey(),
            focusOffset: blockMap.last().getLength(),
        }),
        LIMIT_CHARACTERS_OVERFLOW_STYLE,
    );

    let newEditorState = EditorState.push(
        editorState,
        newContentState,
        'change-inline-style',
    );

    return newEditorState;
}

function insertOverflowInlineStyles(
    editorState: EditorState,
    overflow: number,
) {
    const blocks = editorState
        .getCurrentContent()
        .getBlocksAsArray()
        .filter((b) => b.getType() !== 'atomic');
    const blocksToHighlight: Array<{
        block: string;
        start: number;
        end: number;
    }> = [];

    let overflowLeft = overflow;

    for (const b of blocks.reverse()) {
        const blockLength = b.getLength();

        const end = blockLength;
        let start = blockLength - overflowLeft;

        if (start < 0) {
            start = 0;
        }

        overflowLeft = overflowLeft - (end - start);

        blocksToHighlight.push({start, end, block: b.getKey()});

        if (overflowLeft <= 0) {
            break;
        }
    }
    const firstBlockToSelect = blocksToHighlight[blocksToHighlight.length - 1];
    const lastBlockToSelect = blocksToHighlight[0];

    // apply inline style only to overflow text
    let newContentState = Modifier.applyInlineStyle(
        editorState.getCurrentContent(),
        new SelectionState({
            anchorKey: firstBlockToSelect.block,
            anchorOffset: firstBlockToSelect.start,
            focusKey: lastBlockToSelect.block,
            focusOffset: lastBlockToSelect.end,
        }),
        LIMIT_CHARACTERS_OVERFLOW_STYLE,
    );

    let newEditorState = EditorState.push(
        editorState,
        newContentState,
        'change-inline-style',
    );

    return newEditorState;
}

export function handleOverflowHighlights(
    editorState: EditorState,
    limit: number,
): EditorState {
    const restoreSelection = editorState.getSelection();
    const length = editorState.getCurrentContent().getPlainText().length;
    const overflow = length - limit;
    const reachedLimit = overflow > 0;

    let newEditorState = EditorState.set(editorState, {allowUndo: false});

    newEditorState = clearOverflowInlineStyles(newEditorState);
    if (reachedLimit) {
        newEditorState = insertOverflowInlineStyles(newEditorState, overflow);
    }
    newEditorState = EditorState.forceSelection(
        newEditorState,
        restoreSelection,
    );
    newEditorState = EditorState.set(newEditorState, {allowUndo: true});

    return newEditorState;
}
