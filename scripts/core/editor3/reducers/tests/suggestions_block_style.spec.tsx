import * as Highlights from '../../helpers/highlights';
import * as Setup from './suggestion_setup';

describe('editor3.reducers.suggestion.CREATE_CHANGE_BLOCK_STYLE_SUGGESTION', () => {
    it('should add new suggestion when set H1', () => {
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

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        expect(content.getFirstBlock().getType()).toEqual('H1');
        expect(content.getLastBlock().getType()).toEqual('H1');

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['BLOCK_STYLE_SUGGESTION-1']);
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['BLOCK_STYLE_SUGGESTION-1']);
        }

        expect(Highlights.getHighlightData(editorState, 'BLOCK_STYLE_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'BLOCK_STYLE_SUGGESTION',
            originalStyle: '',
            blockType: 'H1',
        });
    });

    it('should reset H1 when set H1 suggestion for a H1 text', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1', type: 'H1'},
                {key: '9d99u', text: 'paragraph2', type: 'H1'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);
        let content = editorState.getCurrentContent();

        expect(content.getFirstBlock().getType()).toEqual('H1');
        expect(content.getLastBlock().getType()).toEqual('H1');

        editorState = Setup.applySelection(editorState, 0, 4, 1, 6);
        editorState = Setup.addBlockStyleSuggestion(editorState, 'H1', date);

        const selection = editorState.getSelection();

        content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        expect(content.getFirstBlock().getType()).toEqual('unstyled');
        expect(content.getLastBlock().getType()).toEqual('unstyled');

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['BLOCK_STYLE_SUGGESTION-1']);
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['BLOCK_STYLE_SUGGESTION-1']);
        }

        expect(Highlights.getHighlightData(editorState, 'BLOCK_STYLE_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'BLOCK_STYLE_SUGGESTION',
            originalStyle: '',
            blockType: 'H1',
        });
    });

    it('should not add a suggestion when set H1 suggestion 2 times', () => {
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
        editorState = Setup.addBlockStyleSuggestion(editorState, 'H1');
        editorState = Setup.addBlockStyleSuggestion(editorState, 'H1', date, true);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
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

    it('should overwrite H1 suggestion when H2 suggestion is added on the same paragraph', () => {
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
        editorState = Setup.addBlockStyleSuggestion(editorState, 'H2', date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getStartKey()).toEqual(content.getFirstBlock().getKey());
        expect(selection.getEndOffset()).toEqual(6);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        expect(content.getFirstBlock().getType()).toEqual('H2');
        expect(content.getLastBlock().getType()).toEqual('H2');

        let block = content.getFirstBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['BLOCK_STYLE_SUGGESTION-2']);
        }

        block = content.getLastBlock();

        for (let i = 0; i < 10; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['BLOCK_STYLE_SUGGESTION-2']);
        }

        expect(Highlights.getHighlightData(editorState, 'BLOCK_STYLE_SUGGESTION-2')).toEqual({
            date: date,
            author: 'author_id',
            type: 'BLOCK_STYLE_SUGGESTION',
            originalStyle: '',
            blockType: 'H2',
        });
    });
});
