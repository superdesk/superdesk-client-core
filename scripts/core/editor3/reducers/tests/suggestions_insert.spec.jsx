import {EditorState, ContentState} from 'draft-js';
import * as Highlights from '../../helpers/highlights';
import reducer from '../suggestions';

describe('editor3.reducers.suggestion.CREATE_ADD_SUGGESTION', () => {
    it('CREATE_ADD_SUGGESTION - insert text on empty content', () => {
        const initialEditorState = EditorState.createEmpty();
        const date = new Date();

        const result = reducer({
            editorState: initialEditorState,
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_ADD_SUGGESTION',
            payload: {
                text: 'test',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');

        for (let i = 0; i < 4; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-1')).toEqual({
            date: date,
            author: 'author_id',
            type: 'ADD_SUGGESTION',
        });
    });

    it('CREATE_ADD_SUGGESTION - insert text on middle of existing text', () => {
        const content = ContentState.createFromText('initial');
        const initialEditorState = EditorState.createWithContent(content);
        const selection = initialEditorState.getSelection().merge({
            anchorOffset: 2,
            focusOffset: 2,
        });
        const date = new Date();

        const result = reducer({
            editorState: EditorState.acceptSelection(initialEditorState, selection),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_ADD_SUGGESTION',
            payload: {
                text: 'test',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('intestitial');

        for (let i = 0; i < 11; i++) {
            if (i > 1 && i < 6) {
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
    });

    it('CREATE_ADD_SUGGESTION - insert text adjacent to the same user insert suggestion', () => {
        const date = new Date();

        const initialState = reducer({
            editorState: EditorState.createEmpty(),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_ADD_SUGGESTION',
            payload: {
                text: 'initial',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState: initialEditorState} = initialState;
        const selection = initialEditorState.getSelection().merge({
            anchorOffset: 2,
            focusOffset: 2,
        });

        const result = reducer({
            editorState: EditorState.acceptSelection(initialEditorState, selection),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_ADD_SUGGESTION',
            payload: {
                text: 'test',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('intestitial');

        for (let i = 0; i < 11; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
        }
    });


    it('CREATE_ADD_SUGGESTION - insert text adjacent to the different user insert suggestion', () => {
        const date = new Date();

        const initialState = reducer({
            editorState: EditorState.createEmpty(),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_ADD_SUGGESTION',
            payload: {
                text: 'initial',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState: initialEditorState} = initialState;
        const selection = initialEditorState.getSelection().merge({
            anchorOffset: 2,
            focusOffset: 2,
        });

        const result = reducer({
            editorState: EditorState.acceptSelection(initialEditorState, selection),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_ADD_SUGGESTION',
            payload: {
                text: 'test',
                data: {
                    date: date,
                    author: 'other_author_id',
                },
            },
        });

        const {editorState} = result;
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('intestitial');

        for (let i = 0; i < 11; i++) {
            if (i > 1 && i < 6) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-2']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['ADD_SUGGESTION-1']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'ADD_SUGGESTION-2')).toEqual({
            date: date,
            author: 'other_author_id',
            type: 'ADD_SUGGESTION',
        });
    });
});