import * as Highlights from '../../helpers/highlights';
import * as Setup from './suggestion_setup';

describe('editor3.reducers.suggestion.CREATE_CHANGE_STYLE_SUGGESTION', () => {
    it('CREATE_CHANGE_STYLE_SUGGESTION - set BOLD suggestion', () => {
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
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['TOGGLE_BOLD_SUGGESTION-1', 'BOLD']);
            }
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['TOGGLE_BOLD_SUGGESTION-1', 'BOLD']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'TOGGLE_BOLD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'TOGGLE_BOLD_SUGGESTION',
            originalStyle: '',
        });
    });

    it('CREATE_CHANGE_STYLE_SUGGESTION - set BOLD suggestion for a bold text', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1', inlineStyleRanges: [{length: 10, offset: 0, style: 'BOLD'}]},
                {key: '9d99u', text: 'paragraph2', inlineStyleRanges: [{length: 10, offset: 0, style: 'BOLD'}]},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 1, 6);
        editorState = Setup.addStyleSuggestion(editorState, 'BOLD', date);

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
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['BOLD']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['TOGGLE_BOLD_SUGGESTION-1']);
            }
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['TOGGLE_BOLD_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['BOLD']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'TOGGLE_BOLD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'TOGGLE_BOLD_SUGGESTION',
            originalStyle: '',
        });
    });

    it('CREATE_CHANGE_STYLE_SUGGESTION - set BOLD suggestion 2 times', () => {
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
        editorState = Setup.addStyleSuggestion(editorState, 'BOLD');
        editorState = Setup.addStyleSuggestion(editorState, 'BOLD', date, true);

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

    it('CREATE_CHANGE_STYLE_SUGGESTION - set BOLD partially overlapping suggestions', () => {
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
        editorState = Setup.addStyleSuggestion(editorState, 'BOLD');
        editorState = Setup.applySelection(editorState, 0, 0, 1, 3);
        editorState = Setup.addStyleSuggestion(editorState, 'BOLD', date, false);

        const content = editorState.getCurrentContent();

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).has('TOGGLE_BOLD_SUGGESTION-2')).toBe(true);
            expect(block.getInlineStyleAt(i).has('BOLD')).toBe(true);
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 3) {
                expect(block.getInlineStyleAt(i).has('TOGGLE_BOLD_SUGGESTION-2')).toBe(true);
                expect(block.getInlineStyleAt(i).has('BOLD')).toBe(true);
            } else if (i < 6) {
                expect(block.getInlineStyleAt(i).has('TOGGLE_BOLD_SUGGESTION-1')).toBe(true);
                expect(block.getInlineStyleAt(i).has('BOLD')).toBe(true);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }
    });

    it('CREATE_CHANGE_STYLE_SUGGESTION - set BOLD and Italic suggestions', () => {
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
        editorState = Setup.addStyleSuggestion(editorState, 'ITALIC', date);

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
                expect(block.getInlineStyleAt(i).toJS()).toEqual(
                    ['TOGGLE_BOLD_SUGGESTION-1', 'BOLD', 'TOGGLE_ITALIC_SUGGESTION-1', 'ITALIC']);
            }
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            if (i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(
                    ['TOGGLE_BOLD_SUGGESTION-1', 'BOLD', 'TOGGLE_ITALIC_SUGGESTION-1', 'ITALIC']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'TOGGLE_BOLD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'TOGGLE_BOLD_SUGGESTION',
            originalStyle: '',
        });

        expect(Highlights.getHighlightData(editorState, 'TOGGLE_ITALIC_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'TOGGLE_ITALIC_SUGGESTION',
            originalStyle: '',
        });
    });
});
