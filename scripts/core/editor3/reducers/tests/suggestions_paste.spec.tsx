import * as Highlights from '../../helpers/highlights';
import * as Setup from './suggestion_setup';

describe('editor3.reducers.suggestion.PASTE_ADD_SUGGESTION', () => {
    it('should insert text and add a new suggestion when text is pasted', () => {
        const rawContentPaste = {
            blocks: [
                {key: '5vu4i', text: 'pasted text'},
            ],
            entityMap: {},
        };
        const pastedContent = Setup.getInitiaContent(rawContentPaste);
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addPasteSuggestion(editorState, pastedContent, date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('parapasted textgraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(15);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(15);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());

        const block = content.getFirstBlock();

        for (let i = 0; i < 21; i++) {
            if (i < 4 || i >= 15) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'ADD_SUGGESTION',
        });
    });

    it('should insert multiblock text and add a new suggestion when text is pasted', () => {
        const rawContentPaste = {
            blocks: [
                {key: '5vu4i', text: 'pasted1'},
                {key: '6d99u', text: 'pasted2'},
            ],
            entityMap: {},
        };
        const pastedContent = Setup.getInitiaContent(rawContentPaste);
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addPasteSuggestion(editorState, pastedContent, date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('parapasted1\npasted2graph1');
        expect(selection.getStartOffset()).toEqual(7);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(7);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 11; i++) {
            if (i < 4) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
            }
        }

        block = content.getLastBlock();

        for (let i = 0; i < 13; i++) {
            if (i > 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'ADD_SUGGESTION',
        });
    });

    it('should delete selected text and insert new text when text is pasted', () => {
        const rawContentPaste = {
            blocks: [
                {key: '4vu4i', text: 'pasted text'},
            ],
            entityMap: {},
        };
        const pastedContent = Setup.getInitiaContent(rawContentPaste);
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 6);
        editorState = Setup.addPasteSuggestion(editorState, pastedContent, date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragrpasted textaph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(17);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(17);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());

        const block = content.getFirstBlock();

        for (let i = 0; i < 21; i++) {
            if (i < 4 || i >= 17) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else if (i >= 4 && i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'ADD_SUGGESTION',
        });

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'DELETE_SUGGESTION',
        });
    });

    it('should delete multiblock selected text and insert new text when text is pasted', () => {
        const rawContentPaste = {
            blocks: [
                {key: '4vu4i', text: 'pasted text'},
            ],
            entityMap: {},
        };
        const pastedContent = Setup.getInitiaContent(rawContentPaste);
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
        editorState = Setup.addPasteSuggestion(editorState, pastedContent, date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagrpasted textaph2');
        expect(selection.getStartOffset()).toEqual(17);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(17);
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
            } else if (i < 17) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'ADD_SUGGESTION',
        });

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'DELETE_SUGGESTION',
        });
    });

    it('should delete new suggested selected text and insert new text when text is pasted', () => {
        const rawContentPaste = {
            blocks: [
                {key: '4vu4i', text: 'ppppp'},
            ],
            entityMap: {},
        };
        const pastedContent = Setup.getInitiaContent(rawContentPaste);
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'nnnn', date);
        editorState = Setup.applySelection(editorState, 0, 2, 0, 6);
        editorState = Setup.addPasteSuggestion(editorState, pastedContent, date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('parapppppnngraph');
        expect(selection.getStartOffset()).toEqual(9);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(9);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());

        const block = content.getFirstBlock();

        for (let i = 0; i < 16; i++) {
            if (i < 2) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else if (i < 4) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else if (i < 9) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-2']);
            } else if (i < 11) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'ADD_SUGGESTION',
        });

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'DELETE_SUGGESTION',
        });

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-2')).toEqual({
            date: date,
            author: 'author_id',
            type: 'ADD_SUGGESTION',
        });
    });
});
