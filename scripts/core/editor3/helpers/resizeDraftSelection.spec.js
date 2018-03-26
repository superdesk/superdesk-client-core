import {EditorState, ContentState, SelectionState} from 'draft-js';
import {resizeDraftSelection} from './resizeDraftSelection';

const selectionToJsonString = (selection) => JSON.stringify(selection.toJS());
const toJsonString = (obj) => JSON.stringify(obj);

const contentState = ContentState.createFromText(
// eslint-disable-next-line indent
`Not enjoyment, and not sorrow,
Is our destined end or way;
But to act, that each tomorrow
Find us farther than today.`
);

const editorState = EditorState.createWithContent(contentState);

const blockKeys = editorState
    .getCurrentContent()
    .getBlocksAsArray()
    .map((block) => block.getKey());

const getKeyForNthBlock = (n) => blockKeys[n - 1];

describe('editor3.helpers.resizeDraftSelection', () => {
    it('should expand the selection within a block', () => {
        const currentSelection = new SelectionState({
            anchorKey: getKeyForNthBlock(1),
            anchorOffset: 4,
            focusKey: getKeyForNthBlock(1),
            focusOffset: 13,
            isBackward: false,
            hasFocus: false
        });

        const nextSelection = resizeDraftSelection(2, 2, currentSelection, editorState);

        expect(selectionToJsonString(nextSelection)).toBe(toJsonString({
            anchorKey: getKeyForNthBlock(1),
            anchorOffset: 2,
            focusKey: getKeyForNthBlock(1),
            focusOffset: 15,
            isBackward: false,
            hasFocus: false
        }));
    });

    it('should expand the selection across multiple blocks', () => {
        const currentSelection = new SelectionState({
            anchorKey: getKeyForNthBlock(2),
            anchorOffset: 1,
            focusKey: getKeyForNthBlock(3),
            focusOffset: 29,
            isBackward: false,
            hasFocus: false
        });

        const nextSelection = resizeDraftSelection(4, 4, currentSelection, editorState);

        expect(selectionToJsonString(nextSelection)).toBe(toJsonString({
            anchorKey: getKeyForNthBlock(1),
            anchorOffset: 27,
            focusKey: getKeyForNthBlock(4),
            focusOffset: 3,
            isBackward: false,
            hasFocus: false
        }));
    });

    it('should support limiting expansion to a single block', () => {
        const currentSelection = new SelectionState({
            anchorKey: getKeyForNthBlock(2),
            anchorOffset: 7,
            focusKey: getKeyForNthBlock(3),
            focusOffset: 16,
            isBackward: false,
            hasFocus: false
        });

        const nextSelection = resizeDraftSelection(20, 20, currentSelection, editorState, true);

        expect(selectionToJsonString(nextSelection)).toBe(toJsonString({
            anchorKey: getKeyForNthBlock(2),
            anchorOffset: 0,
            focusKey: getKeyForNthBlock(3),
            focusOffset: 30,
            isBackward: false,
            hasFocus: false
        }));
    });

    it('should shrink the selection within a block', () => {
        const currentSelection = new SelectionState({
            anchorKey: getKeyForNthBlock(2),
            anchorOffset: 7,
            focusKey: getKeyForNthBlock(2),
            focusOffset: 15,
            isBackward: false,
            hasFocus: false
        });

        const nextSelection = resizeDraftSelection(-3, -3, currentSelection, editorState);

        expect(selectionToJsonString(nextSelection)).toBe(toJsonString({
            anchorKey: getKeyForNthBlock(2),
            anchorOffset: 10,
            focusKey: getKeyForNthBlock(2),
            focusOffset: 12,
            isBackward: false,
            hasFocus: false
        }));
    });

    it('should shrink the selection across multiple blocks', () => {
        const currentSelection = new SelectionState({
            anchorKey: getKeyForNthBlock(1),
            anchorOffset: 4,
            focusKey: getKeyForNthBlock(4),
            focusOffset: 20,
            isBackward: false,
            hasFocus: false
        });

        const nextSelection = resizeDraftSelection(-70, -29, currentSelection, editorState);

        expect(selectionToJsonString(nextSelection)).toBe(toJsonString({
            anchorKey: getKeyForNthBlock(3),
            anchorOffset: 17,
            focusKey: getKeyForNthBlock(3),
            focusOffset: 21,
            isBackward: false,
            hasFocus: false
        }));
    });
});
