import * as Highlights from '../../helpers/highlights';
import * as Setup from './suggestion_setup';

describe('editor3.reducers.suggestion.CREATE_SPLIT_PARAGRAPH_SUGGESTION', () => {
    it('should add new split suggestion on enter key', () => {
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

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1¶\nparagraph2');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(0);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());


        let block = content.getFirstBlock();

        expect(block.getInlineStyleAt(10).toJS()).toEqual(['SPLIT_PARAGRAPH_SUGGESTION-1']);

        expect(Highlights.getHighlightData(editorState, 'SPLIT_PARAGRAPH_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'SPLIT_PARAGRAPH_SUGGESTION',
        });
    });

    it('should not add suggestion when before it there is a merge suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 1, 0, 1, 0);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace');
        editorState = Setup.addSplitParagraphSuggestion(editorState, date);

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1\nparagraph2');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(0);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());
    });

    it('should add new suggestion when before it there is a merge suggestion created by a different user', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 1, 0, 1, 0);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace');
        editorState = Setup.addSplitParagraphSuggestion(editorState, date, 'author_2');

        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        expect(content.getPlainText()).toEqual('paragraph1¶\n¶paragraph2');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getStartKey()).toEqual(content.getLastBlock().getKey());
        expect(selection.getEndOffset()).toEqual(0);
        expect(selection.getEndKey()).toEqual(content.getLastBlock().getKey());

        let block = content.getFirstBlock();

        expect(block.getInlineStyleAt(10).toJS()).toEqual(['SPLIT_PARAGRAPH_SUGGESTION-1']);

        block = content.getLastBlock();
        expect(block.getInlineStyleAt(0).toJS()).toEqual(['MERGE_PARAGRAPHS_SUGGESTION-1']);

        expect(Highlights.getHighlightData(editorState, 'SPLIT_PARAGRAPH_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_2',
            type: 'SPLIT_PARAGRAPH_SUGGESTION',
        });
    });
});
