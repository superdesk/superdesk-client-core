import * as Setup from './suggestion_setup';

describe('editor3.reducers.suggestion.ACCEPT_REJECT_SUGGESTION', () => {
    it('should keep the added text when the insert suggestion is accepted', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'test');
        editorState = Setup.applySelection(editorState, 0, 4, 0, 8);
        editorState = Setup.processSuggestion(editorState, 'CREATE_ADD_SUGGESTION', true);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paratestgraph1');
        expect(selection.getStartOffset()).toEqual(8);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(8);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 14; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should delete the suggest text when an insert suggestion is rejected', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'test');
        editorState = Setup.applySelection(editorState, 0, 4, 0, 8);
        editorState = Setup.processSuggestion(editorState, 'CREATE_ADD_SUGGESTION', false);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(4);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should delete the text when a delete suggestion is accepted', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 6, 1, 4);
        editorState = Setup.addDeleteSuggestion(editorState);
        editorState = Setup.applySelection(editorState, 0, 6, 1, 4);
        editorState = Setup.processSuggestion(editorState, 'CREATE_DELETE_SUGGESTION', true);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragrgraph2');
        expect(selection.getStartOffset()).toEqual(6);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 6; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }

        block = content.getLastBlock();
        for (let i = 0; i < 6; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should keep the suggested text when a delete suggestion is rejected', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 6, 1, 4);
        editorState = Setup.addDeleteSuggestion(editorState);
        editorState = Setup.applySelection(editorState, 0, 6, 1, 4);
        editorState = Setup.processSuggestion(editorState, 'CREATE_DELETE_SUGGESTION', false);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(4);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }

        block = content.getLastBlock();
        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should delete old text and keep the new text when a replace suggestion is accepted', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 6, 1, 4);
        editorState = Setup.addDeleteSuggestion(editorState);
        editorState = Setup.applySelection(editorState, 1, 4, 1, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'test');
        editorState = Setup.applySelection(editorState, 0, 6, 1, 8);
        editorState = Setup.processSuggestion(editorState, 'CREATE_DELETE_SUGGESTION', true);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragrtestgraph2');
        expect(selection.getStartOffset()).toEqual(10);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(10);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 12; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should keep the old text and delete the new text when a replace suggestion is rejected', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 6, 1, 4);
        editorState = Setup.addDeleteSuggestion(editorState);
        editorState = Setup.applySelection(editorState, 1, 4, 1, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'test');
        editorState = Setup.applySelection(editorState, 0, 6, 1, 8);
        editorState = Setup.processSuggestion(editorState, 'CREATE_DELETE_SUGGESTION', false);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(4);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }

        block = content.getLastBlock();
        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should keep the new line when a split paragraphs suggestion is accepted', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 10, 0, 10);
        editorState = Setup.addSplitParagraphSuggestion(editorState, date);
        editorState = Setup.applySelection(editorState, 0, 10, 0, 11);
        editorState = Setup.processSuggestion(editorState, 'SPLIT_PARAGRAPH_SUGGESTION', true);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(10);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(10);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());


        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }

        block = content.getLastBlock();
        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should delete the new line when a split paragraphs suggestion is rejected', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 10, 0, 10);
        editorState = Setup.addSplitParagraphSuggestion(editorState, date);
        editorState = Setup.applySelection(editorState, 0, 10, 0, 11);
        editorState = Setup.processSuggestion(editorState, 'SPLIT_PARAGRAPH_SUGGESTION', false);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1paragraph2');
        expect(selection.getStartOffset()).toEqual(10);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(10);
        expect(selection.getEndKey()).toEqual(content.getFirstBlock().getKey());


        let block = content.getFirstBlock();

        for (let i = 0; i < 20; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should keep BOLD formatting, when a BOLD style suggestion is accepted', () => {
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
        editorState = Setup.addStyleSuggestion(editorState, 'BOLD', date);
        editorState = Setup.applySelection(editorState, 0, 4, 1, 6);
        editorState = Setup.processSuggestion(editorState, 'TOGGLE_BOLD_SUGGESTION', true);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 4) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['BOLD']);
            }
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['BOLD']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }
    });

    it('should delete BOLD formatting, when a BOLD style suggestion is rejected', () => {
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
        editorState = Setup.addStyleSuggestion(editorState, 'BOLD', date);
        editorState = Setup.applySelection(editorState, 0, 4, 1, 6);
        editorState = Setup.processSuggestion(editorState, 'TOGGLE_BOLD_SUGGESTION', false);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should keep block style when block style suggestion is accepted', () => {
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
        editorState = Setup.addBlockStyleSuggestion(editorState, 'H1', date);
        editorState = Setup.applySelection(editorState);
        editorState = Setup.processSuggestion(editorState, 'BLOCK_STYLE_SUGGESTION', true);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(10);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        expect(content.getFirstBlock().getType()).toEqual('H1');
        expect(content.getLastBlock().getType()).toEqual('H1');

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should reset block style when block style suggestion is rejected', () => {
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
        editorState = Setup.addBlockStyleSuggestion(editorState, 'H1', date);
        editorState = Setup.applySelection(editorState);
        editorState = Setup.processSuggestion(editorState, 'BLOCK_STYLE_SUGGESTION', false);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(10);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        expect(content.getFirstBlock().getType()).toEqual('unstyled');
        expect(content.getLastBlock().getType()).toEqual('unstyled');

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });
});