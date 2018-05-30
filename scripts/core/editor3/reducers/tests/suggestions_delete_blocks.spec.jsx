import * as Highlights from '../../helpers/highlights';
import * as Setup from './suggestion_setup';

describe('editor3.reducers.suggestion.DELETE_BLOCKS_SUGGESTION', () => {
    it('should create only one suggestion when backspace a selection on multiple blocks', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 1, 6);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace', date);

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

    it('should create only one suggestion when delete a selection on multiple blocks', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 1, 6);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete', date);

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

    it('should add ¶ for empty block when delete blocks with one empty paragraph, ', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: ''},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 2, 6);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const secondBlock = content.getBlockAfter(content.getFirstBlock().getKey());

        expect(content.getPlainText()).toEqual('paragraph1\n¶\nparagraph3');
        expect(secondBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('should add  ¶ for empty block when delete list with one empty item,', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'one', type: 'ordered-list-item'},
                {key: '739sm', text: '', type: 'ordered-list-item'},
                {key: '9d99u', text: 'three', type: 'ordered-list-item'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 1, 2, 3);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();
        const secondBlock = content.getBlockAfter(firstBlock.getKey());

        expect(content.getPlainText()).toEqual('one\n¶\nthree');
        expect(secondBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('should add ¶ for first block when delete paragraph with one empty item at beginning', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: ''},
                {key: '739sm', text: 'two'},
                {key: '9d99u', text: 'three'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();

        expect(content.getPlainText()).toEqual('¶\ntwo\nthree');
        expect(firstBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('should add ¶ is added for last block when delete paragraph with one empty item at the end', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'one'},
                {key: '739sm', text: 'two'},
                {key: '9d99u', text: ''},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete');
        const content = editorState.getCurrentContent();
        const lastBlock = content.getLastBlock();

        expect(content.getPlainText()).toEqual('one\ntwo\n¶');
        expect(lastBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-1', 'DELETE_SUGGESTION-1']);
    });

    it('should overwrite an already added delete suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 1, 6);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace');

        editorState = Setup.applySelection(editorState, 0, 2, 1, 8);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace', date);

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

    it('should overwrite already existing delete suggestion with one empty paragraph', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: ''},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 2, 3);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete');

        editorState = Setup.applySelection(editorState, 0, 2, 2, 6);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete');

        const content = editorState.getCurrentContent();
        const firstBlock = content.getFirstBlock();
        const secondBlock = content.getBlockAfter(firstBlock.getKey());

        expect(content.getPlainText()).toEqual('paragraph1\n¶\nparagraph3');
        expect(secondBlock.getInlineStyleAt(0).toJS()).toEqual(
            ['DELETE_EMPTY_PARAGRAPH_SUGGESTION-2', 'DELETE_SUGGESTION-2']);
    });

    it('should overwrite already existing merge suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: 'paragraph2'},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 1, 0, 1, 0);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace');

        let content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1¶paragraph2\nparagraph3');

        editorState = Setup.applySelection(editorState, 0, 2, 1, 6);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace');

        content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1paragraph2\nparagraph3');
    });

    it('should overwrite already existing insert suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '739sm', text: 'para'},
                {key: '9d99u', text: 'paragraph3'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 1, 4, 1, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'graph2');

        let content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2\nparagraph3');

        editorState = Setup.applySelection(editorState, 0, 2, 2, 6);
        editorState = Setup.addDeleteSuggestion(editorState, 'delete');

        content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\npara\nparagraph3');
    });
});
