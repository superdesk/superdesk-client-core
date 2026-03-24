import {EditorState} from 'draft-js';
import * as Setup from '../../reducers/tests/suggestion_setup';
import {getCharsBeforeCursor, getSelectedCharsCount} from '../cursor-position-count';

function makeEditor(texts: Array<string>) {
    const rawContent = {
        blocks: texts.map((text, i) => ({key: `block${i}`, text})),
        entityMap: {},
    };

    return Setup.getInitialEditorState(rawContent);
}

function withSelection(
    editorState: EditorState,
    startBlockIndex: number,
    startOffset: number,
    endBlockIndex: number,
    endOffset: number,
): EditorState {
    return Setup.applySelection(editorState, startBlockIndex, startOffset, endBlockIndex, endOffset);
}

function withCollapsedCursor(
    editorState: EditorState,
    blockIndex: number,
    offset: number,
): EditorState {
    return withSelection(editorState, blockIndex, offset, blockIndex, offset);
}

function withReversedSelection(
    editorState: EditorState,
    startBlockIndex: number,
    startOffset: number,
    endBlockIndex: number,
    endOffset: number,
): EditorState {
    const content = editorState.getCurrentContent();
    const blocks = content.getBlocksAsArray();
    const startBlock = blocks[startBlockIndex];
    const endBlock = blocks[endBlockIndex];

    const selection = editorState.getSelection().merge({
        anchorKey: endBlock.getKey(),
        anchorOffset: endOffset,
        focusKey: startBlock.getKey(),
        focusOffset: startOffset,
        isBackward: true,
    });

    return EditorState.acceptSelection(editorState, selection);
}

describe('editor3.helpers.cursor-position-count', () => {
    describe('getCharsBeforeCursor', () => {
        it('returns 0 for empty editor with collapsed selection at offset 0', () => {
            const editorState = withCollapsedCursor(makeEditor(['']), 0, 0);

            expect(getCharsBeforeCursor(editorState)).toBe(0);
        });

        it('returns the block offset for a single-block collapsed selection in the middle', () => {
            const editorState = withCollapsedCursor(makeEditor(['hello world']), 0, 5);

            expect(getCharsBeforeCursor(editorState)).toBe(5);
        });

        it('sums lengths of previous blocks plus current offset for multi-block content', () => {
            // 'aaa' = 3, 'bbbb' = 4, cursor at offset 2 in third block
            const editorState = withCollapsedCursor(makeEditor(['aaa', 'bbbb', 'ccccc']), 2, 2);

            expect(getCharsBeforeCursor(editorState)).toBe(3 + 4 + 2);
        });

        it('does not count block separators or newlines between blocks', () => {
            // cursor at start of second block — count should be length of first block only
            const editorState = withCollapsedCursor(makeEditor(['hello', 'world']), 1, 0);

            expect(getCharsBeforeCursor(editorState)).toBe(5);
        });

        it('returns total raw character count when cursor is at end of document', () => {
            const editorState = withCollapsedCursor(makeEditor(['aaa', 'bb', 'c']), 2, 1);

            expect(getCharsBeforeCursor(editorState)).toBe(3 + 2 + 1);
        });

        it('handles empty blocks before cursor', () => {
            // 'aaa' = 3, '' = 0, cursor at offset 2 in third block
            const editorState = withCollapsedCursor(makeEditor(['aaa', '', 'bbb']), 2, 2);

            expect(getCharsBeforeCursor(editorState)).toBe(3 + 0 + 2);
        });
    });

    describe('getSelectedCharsCount', () => {
        it('returns endOffset - startOffset for a single-block selection', () => {
            const editorState = withSelection(makeEditor(['hello world']), 0, 2, 0, 7);

            expect(getSelectedCharsCount(editorState)).toBe(5);
        });

        it('counts tail of first block + head of last block for two-block selection', () => {
            // 'hello' selected from offset 3 = 2 chars, 'world' selected to offset 3 = 3 chars
            const editorState = withSelection(makeEditor(['hello', 'world']), 0, 3, 1, 3);

            expect(getSelectedCharsCount(editorState)).toBe(2 + 3);
        });

        it('counts tail + full middle blocks + head for multi-block selection', () => {
            // 'aaaa' from offset 2 = 2, 'bbb' full = 3, 'cc' to offset 1 = 1
            const editorState = withSelection(makeEditor(['aaaa', 'bbb', 'cc']), 0, 2, 2, 1);

            expect(getSelectedCharsCount(editorState)).toBe(2 + 3 + 1);
        });

        it('returns the same length for a reversed (backward) selection', () => {
            const texts = ['hello', 'world'];
            const forward = withSelection(makeEditor(texts), 0, 2, 1, 3);
            const backward = withReversedSelection(makeEditor(texts), 0, 2, 1, 3);

            expect(getSelectedCharsCount(backward)).toBe(getSelectedCharsCount(forward));
        });

        it('handles selection spanning empty blocks', () => {
            // 'aaa' from offset 1 = 2, '' = 0, 'bbb' to offset 2 = 2
            const editorState = withSelection(makeEditor(['aaa', '', 'bbb']), 0, 1, 2, 2);

            expect(getSelectedCharsCount(editorState)).toBe(2 + 0 + 2);
        });

        it('handles selection ending at an empty last block', () => {
            // 'hello' from offset 2 = 3, '' to offset 0 = 0
            const editorState = withSelection(makeEditor(['hello', '']), 0, 2, 1, 0);

            expect(getSelectedCharsCount(editorState)).toBe(3 + 0);
        });

        it('returns 0 for a collapsed selection', () => {
            const editorState = withCollapsedCursor(makeEditor(['hello']), 0, 3);

            expect(getSelectedCharsCount(editorState)).toBe(0);
        });

        it('selects entire document when spanning from start to end', () => {
            const editorState = withSelection(makeEditor(['aaa', 'bb', 'c']), 0, 0, 2, 1);

            expect(getSelectedCharsCount(editorState)).toBe(3 + 2 + 1);
        });
    });
});
