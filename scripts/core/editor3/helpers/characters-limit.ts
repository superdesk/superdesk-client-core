import {
    EditorState,
    Modifier,
    SelectionState,
    ContentState,
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

function clearOverflowInlineStyles(contentState: ContentState): ContentState {
    const blockMap = contentState.getBlockMap();

    // clear `LIMIT_CHARACTERS_OVERFLOW_STYLE` from all text
    return Modifier.removeInlineStyle(
        contentState,
        new SelectionState({
            anchorKey: blockMap.first().getKey(),
            anchorOffset: 0,
            focusKey: blockMap.last().getKey(),
            focusOffset: blockMap.last().getLength(),
        }),
        LIMIT_CHARACTERS_OVERFLOW_STYLE,
    );
}

function insertStyles(
    contentState: ContentState,
    overflow: number,
): ContentState {
    const blocks = contentState
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
    return Modifier.applyInlineStyle(
        contentState,
        new SelectionState({
            anchorKey: firstBlockToSelect.block,
            anchorOffset: firstBlockToSelect.start,
            focusKey: lastBlockToSelect.block,
            focusOffset: lastBlockToSelect.end,
        }),
        LIMIT_CHARACTERS_OVERFLOW_STYLE,
    );
}

function insertOverflowInlineStyles(
    contentState: ContentState,
    limit: number,
): ContentState {
    const length = getEditorFieldCharactersCount(contentState.getPlainText(), false);

    if (length < 1) {
        return contentState;
    }

    const overflow = length - limit;
    const reachedLimit = overflow > 0;

    if (!reachedLimit) {
        return contentState;
    }

    return insertStyles(contentState, overflow);
}

export function handleOverflowHighlights(editorState: EditorState, limit: number | null) {
    const restoreSelection = editorState.getSelection();

    let newEditorState = EditorState.set(editorState, {allowUndo: false});

    const selectionBefore = newEditorState.getCurrentContent().getSelectionBefore();
    const selectionAfter = newEditorState.getCurrentContent().getSelectionAfter();

    let newContentState = clearOverflowInlineStyles(newEditorState.getCurrentContent());

    if (limit) {
        newContentState = insertOverflowInlineStyles(newContentState, limit);
    }

    /**
     * Changes to contentState also change
     * selectionAfter / selectionBefore
     * Since only inline styles are being modified here,
     * it's safe to maintain selectionAfter / selectionBefore.
     * Because undo is disabled on `newEditorState` at the moment,
     * NOT maintaining selectionAfter / selectionBefore would lead
     * to undo issues where after undoing, selection state would have
     * block keys specified which don't exist in the content state's block map.
     */
    newContentState = newContentState.merge({
        selectionAfter,
        selectionBefore,
    }) as ContentState;

    newEditorState = EditorState.push(
        newEditorState,
        newContentState,
        'change-inline-style',
    );

    newEditorState = EditorState.forceSelection(
        newEditorState,
        restoreSelection,
    );

    newEditorState = EditorState.set(newEditorState, {allowUndo: true});

    return newEditorState;
}
