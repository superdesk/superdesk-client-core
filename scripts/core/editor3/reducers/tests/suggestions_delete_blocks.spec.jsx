import {EditorState, convertFromRaw} from 'draft-js';
import * as Highlights from '../../helpers/highlights';
import reducer from '../suggestions';

function prepareRawContent(rawContent) {
    const defaultBlock = {
        entityRanges: [],
        inlineStyleRanges: [],
        depth: 0,
        type: 'unstyled',
        text: '',
        data: {},
    };

    let newRawContent = {
        blocks: [],
        entityMap: {},
        ...rawContent,
    };

    let blocks = newRawContent.blocks.map((block) => ({
        ...defaultBlock,
        ...block,
    }));

    newRawContent.blocks = blocks;

    return newRawContent;
}

function getInitialEditorState(rawContent) {
    const content = convertFromRaw(prepareRawContent(rawContent));

    return EditorState.createWithContent(content);
}

function applySelection(editorState, startBlockIndex, startOffset, endBlockIndex, endOffset) {
    const content = editorState.getCurrentContent();
    let startBlock = content.getFirstBlock();
    let endBlock = content.getLastBlock();
    let block = startBlock;
    let index = 0;

    while (block != null) {
        if (index === startBlockIndex) {
            startBlock = block;
        }
        if (index === endBlockIndex) {
            endBlock = block;
        }
        block = content.getBlockAfter(block.getKey());
        index++;
    }

    const selection = editorState.getSelection().merge({
        anchorOffset: startOffset == null ? 0 : startOffset,
        anchorKey: startBlock.getKey(),
        focusOffset: endOffset == null ? endBlock.getLength() : endOffset,
        focusKey: endBlock.getKey(),
        isBackward: false,
    });

    return EditorState.acceptSelection(editorState, selection);
}

function addDeleteSuggestion(editorState, action, date) {
    const result = reducer({
        editorState: editorState,
        suggestingMode: true,
        onChangeValue: () => ({}),
    }, {
        type: 'CREATE_DELETE_SUGGESTION',
        payload: {
            action: action,
            data: {
                date: date == null ? new Date() : date,
                author: 'author_id',
            },
        },
    });

    return result.editorState;
}

function addInsertSuggestion(editorState, text, date) {
    const result = reducer({
        editorState: editorState,
        suggestingMode: true,
        onChangeValue: () => ({}),
    }, {
        type: 'CREATE_ADD_SUGGESTION',
        payload: {
            text: text,
            data: {
                date: date == null ? new Date() : date,
                author: 'author_id',
            },
        },
    });

    return result.editorState;
}

describe('editor3.reducers.suggestion.DELETE_BLOCKS_SUGGESTION', () => {
    it('DELETE_BLOCKS_SUGGESTION - backspace blocks', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 0, 4, 1, 6);
        editorState = addDeleteSuggestion(editorState, 'backspace', date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(4);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 4) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            }
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'DELETE_SUGGESTION',
        });
    });

    it('DELETE_BLOCKS_SUGGESTION - delete blocks', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 0, 4, 1, 6);
        editorState = addDeleteSuggestion(editorState, 'delete', date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(6);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 4) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            }
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'DELETE_SUGGESTION',
        });
    });

    it('DELETE_BLOCKS_SUGGESTION - delete blocks with one empty paragraph', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: ''},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 0, 4, 2, 6);
        editorState = addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const secondBlock = content.getBlockAfter(content.getFirstBlock().getKey());

        expect(content.getPlainText()).toEqual('paragraph1\n¶\nparagraph3');
        expect(secondBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('DELETE_BLOCKS_SUGGESTION - delete list with one empty item', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'one', type: 'ordered-list-item'},
                {key: '739sm', text: '', type: 'ordered-list-item'},
                {key: '9d99u', text: 'three', type: 'ordered-list-item'},
            ],
            entityMap: {},
        };
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 0, 1, 2, 3);
        editorState = addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();
        const secondBlock = content.getBlockAfter(firstBlock.getKey());

        expect(content.getPlainText()).toEqual('one\n¶\nthree');
        expect(secondBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('DELETE_BLOCKS_SUGGESTION - delete paragraph with one empty item at beginning', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: ''},
                {key: '739sm', text: 'two'},
                {key: '9d99u', text: 'three'},
            ],
            entityMap: {},
        };
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState);
        editorState = addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();

        expect(content.getPlainText()).toEqual('¶\ntwo\nthree');
        expect(firstBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('DELETE_BLOCKS_SUGGESTION - delete paragraph with one empty item at the end', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'one'},
                {key: '739sm', text: 'two'},
                {key: '9d99u', text: ''},
            ],
            entityMap: {},
        };
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState);
        editorState = addDeleteSuggestion(editorState, 'delete');
        const content = editorState.getCurrentContent();
        const lastBlock = content.getLastBlock();

        expect(content.getPlainText()).toEqual('one\ntwo\n¶');
        expect(lastBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('DELETE_BLOCKS_SUGGESTION - overwrite an already added delete suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 0, 4, 1, 6);
        editorState = addDeleteSuggestion(editorState, 'backspace');

        editorState = applySelection(editorState, 0, 2, 1, 8);
        editorState = addDeleteSuggestion(editorState, 'backspace', date);

        const content = editorState.getCurrentContent();
        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 2) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-2']);
            }
        }

        block = content.getLastBlock();
        for (let i = 0; i < 10; i++) {
            if (i < 8) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-2']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-2')).toEqual({
            date: date,
            author: 'author_id',
            type: 'DELETE_SUGGESTION',
        });
    });

    it('DELETE_BLOCKS_SUGGESTION - overwrite already existing delete suggestion with one empty paragraph', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: ''},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 0, 4, 2, 3);
        editorState = addDeleteSuggestion(editorState, 'delete');

        editorState = applySelection(editorState, 0, 2, 2, 6);
        editorState = addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();
        const secondBlock = content.getBlockAfter(firstBlock.getKey());

        expect(content.getPlainText()).toEqual('paragraph1\n¶\nparagraph3');
        expect(secondBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-2', 'DELETE_SUGGESTION-2']);
    });

    it('DELETE_BLOCKS_SUGGESTION - overwrite already existing merge suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: 'paragraph2'},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 1, 0, 1, 0);
        editorState = addDeleteSuggestion(editorState, 'backspace');

        let content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1¶paragraph2\nparagraph3');

        editorState = applySelection(editorState, 0, 2, 1, 6);
        editorState = addDeleteSuggestion(editorState, 'backspace');

        content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1paragraph2\nparagraph3');
    });

    it('DELETE_BLOCKS_SUGGESTION - overwrite already existing insert suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: 'para'},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = getInitialEditorState(rawContent);

        editorState = applySelection(editorState, 1, 4, 1, 4);
        editorState = addInsertSuggestion(editorState, 'graph2');

        let content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2\nparagraph3');

        editorState = applySelection(editorState, 0, 2, 2, 6);
        editorState = addDeleteSuggestion(editorState, 'delete');

        content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\npara\nparagraph3');
    });
});
