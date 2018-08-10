import * as Setup from '../../reducers/tests/suggestion_setup';
import {allowEditSuggestionOnRight, allowEditSuggestionOnLeft} from '../suggestions';

describe('editor3.helpers.suggestion.allowEditSuggestion', () => {
    it('should allow edit suggestion when user edits his insert text suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        const author = 'author';
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'test', date, author);
        editorState = Setup.applySelection(editorState, 0, 6, 0, 6);

        expect(allowEditSuggestionOnLeft(editorState, author)).toEqual(true);
        expect(allowEditSuggestionOnRight(editorState, author)).toEqual(true);
    });

    it('should not allow edit suggestion when user edits a delete text suggestion', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        const author = 'author';
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 8);
        editorState = Setup.addDeleteSuggestion(editorState, 'backspace', date, author);

        editorState = Setup.applySelection(editorState, 0, 6, 0, 6);
        expect(allowEditSuggestionOnLeft(editorState, author)).toEqual(false);
        expect(allowEditSuggestionOnRight(editorState, author)).toEqual(false);
    });

    it('should not allow to split insert suggestion by deleting a selection on middle of inserted text', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        const author = 'author';
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'testtest', date, author);
        editorState = Setup.applySelection(editorState, 0, 6, 0, 8);

        expect(allowEditSuggestionOnLeft(editorState, author)).toEqual(false);
        expect(allowEditSuggestionOnRight(editorState, author)).toEqual(false);
    });

    it('should allow to edit a insert suggestion by deleting a selection on left side of inserted text', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        const author = 'author';
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'testtest', date, author);
        editorState = Setup.applySelection(editorState, 0, 4, 0, 8);

        expect(allowEditSuggestionOnLeft(editorState, author)).toEqual(true);
        expect(allowEditSuggestionOnRight(editorState, author)).toEqual(true);
    });

    it('should allow to edit a insert suggestion by deleting a selection on right side of inserted text', () => {
        const rawContent = {
            blocks: [
                {key: '4vu4i', text: 'paragraph1'},
                {key: '9d99u', text: 'paragraph2'},
            ],
            entityMap: {},
        };
        const date = new Date();
        const author = 'author';
        let editorState = Setup.getInitialEditorState(rawContent);

        editorState = Setup.applySelection(editorState, 0, 4, 0, 4);
        editorState = Setup.addInsertSuggestion(editorState, 'testtest', date, author);
        editorState = Setup.applySelection(editorState, 0, 10, 0, 12);

        expect(allowEditSuggestionOnLeft(editorState, author)).toEqual(true);
        expect(allowEditSuggestionOnRight(editorState, author)).toEqual(true);
    });
});
