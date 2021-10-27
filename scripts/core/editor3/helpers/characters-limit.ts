import {
    EditorState,
    Modifier,
    SelectionState,
} from 'draft-js';
import {getEditorFieldCharactersCount} from 'apps/authoring/authoring/components/CharacterCount';
import getFragmentFromSelection from 'draft-js/lib/getFragmentFromSelection';

export const LIMIT_CHARACTERS_OVERFLOW_STYLE = 'LIMIT_CHARACTERS_OVERFLOW';

export function preventInputWhenLimitIsPassed(
    editorState: EditorState,
    newChars: string,
    limit: number,
) {
    const length =
        getEditorFieldCharactersCount(editorState.getCurrentContent().getPlainText(), false) +
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

    const selectedFragment = getFragmentFromSelection(editorState);
    const selectedText = selectedFragment?.map((b) => b.getText()).join('') || '';

    return selectedText.length;
}

function clearOverflowInlineStyles(editorState: EditorState) {
    const restoreSelection = editorState.getSelection();
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

    let newEditorState = EditorState.set(editorState, {allowUndo: false});

    newEditorState = EditorState.push(
        newEditorState,
        newContentState,
        'change-inline-style',
    );
    newEditorState = EditorState.forceSelection(newEditorState, restoreSelection);
    newEditorState = EditorState.set(newEditorState, {allowUndo: true});

    return newEditorState;
}

function insertStyles(
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

function insertOverflowInlineStyles(
    editorState: EditorState,
    limit: number,
): EditorState {
    const length = getEditorFieldCharactersCount(editorState.getCurrentContent().getPlainText(), false);

    if (length < 1) {
        return editorState;
    }

    const restoreSelection = editorState.getSelection();
    const overflow = length - limit;
    const reachedLimit = overflow > 0;

    if (!reachedLimit) {
        return editorState;
    }

    let newEditorState = EditorState.set(editorState, {allowUndo: false});

    newEditorState = insertStyles(newEditorState, overflow);
    newEditorState = EditorState.forceSelection(
        newEditorState,
        restoreSelection,
    );
    newEditorState = EditorState.set(newEditorState, {allowUndo: true});

    return newEditorState;
}

export function handleOverflowHighlights(editorState: EditorState, limit: number | null) {
    let newEditorState = clearOverflowInlineStyles(editorState);

    if (limit) {
        newEditorState = insertOverflowInlineStyles(newEditorState, limit);
    }

    return newEditorState;
}
