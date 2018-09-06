import {EditorState, ContentState, SelectionState} from 'draft-js';
import * as Highlights from '../../helpers/highlights';
import reducer from '../suggestions';

function getInitialEditorState(startOffset = 2, endOffset = 2) {
    const content = ContentState.createFromText('test');
    const editorState = EditorState.createWithContent(content);
    const selection = editorState.getSelection().merge({
        anchorOffset: startOffset,
        focusOffset: endOffset,
    }) as SelectionState;

    return EditorState.acceptSelection(editorState, selection);
}

function getEditorStateWithDeleteSuggestion(author, date, startOffset, endOffset, action = 'backspace') {
    const result = reducer({
        editorState: getInitialEditorState(startOffset, endOffset),
        suggestingMode: true,
        onChangeValue: () => ({}),
    }, {
        type: 'CREATE_DELETE_SUGGESTION',
        payload: {
            action: action,
            data: {
                date: date,
                author: author,
            },
        },
    });

    const {editorState} = result;

    return editorState;
}


describe('editor3.reducers.suggestion.CREATE_DELETE_SUGGESTION', () => {
    it('should suggest a character delete by using backspace key', () => {
        const date = new Date();
        const result = reducer({
            editorState: getInitialEditorState(),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'backspace',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(1);
        expect(selection.getEndOffset()).toEqual(1);

        for (let i = 0; i < 4; i++) {
            if (i === 1) {
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

    it('should suggest a character delete by using delete key', () => {
        const date = new Date();
        const result = reducer({
            editorState: getInitialEditorState(),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'delete',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(3);
        expect(selection.getEndOffset()).toEqual(3);

        for (let i = 0; i < 4; i++) {
            if (i === 2) {
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

    it('should not add suggestion when backspace a character at beginning of the paragraph', () => {
        const date = new Date();
        const result = reducer({
            editorState: getInitialEditorState(0, 0),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'backspace',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getEndOffset()).toEqual(0);

        for (let i = 0; i < 4; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should not add suggestion when delete a character at the end of the paragraph', () => {
        const date = new Date();
        const result = reducer({
            editorState: getInitialEditorState(4, 4),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'delete',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getEndOffset()).toEqual(4);

        for (let i = 0; i < 4; i++) {
            expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
        }
    });

    it('should add new suggestion when backspace a selected text', () => {
        const date = new Date();
        const result = reducer({
            editorState: getInitialEditorState(1, 3),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'backspace',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(1);
        expect(selection.getEndOffset()).toEqual(1);

        for (let i = 0; i < 4; i++) {
            if (i > 0 && i < 3) {
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

    it('should add new suggestion when delete a selected text', () => {
        const date = new Date();
        const result = reducer({
            editorState: getInitialEditorState(1, 3),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'delete',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(3);
        expect(selection.getEndOffset()).toEqual(3);

        for (let i = 0; i < 4; i++) {
            if (i > 0 && i < 3) {
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


    it('should extend old suggestion when backspace before an existing suggestion with the same author', () => {
        const date = new Date();
        const result = reducer({
            editorState: getEditorStateWithDeleteSuggestion('author_id', date, 1, 3),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'backspace',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getEndOffset()).toEqual(0);

        for (let i = 0; i < 4; i++) {
            if (i !== 3) {
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

    it('should extend suggestion when delete with the same author after an existing delete suggestion', () => {
        const date = new Date();
        const result = reducer({
            editorState: getEditorStateWithDeleteSuggestion('author_id', date, 1, 3, 'delete'),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'delete',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getEndOffset()).toEqual(4);

        for (let i = 0; i < 4; i++) {
            if (i !== 0) {
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

    it('should add new suggestion when backspace with different author before an existing delete suggestion', () => {
        const date = new Date();
        const result = reducer({
            editorState: getEditorStateWithDeleteSuggestion('author_id1', date, 1, 3),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'backspace',
                data: {
                    date: date,
                    author: 'author_id2',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(0);
        expect(selection.getEndOffset()).toEqual(0);

        for (let i = 0; i < 4; i++) {
            if (i === 0) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-2']);
            } else if (i < 3) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-2')).toEqual({
            date: date,
            author: 'author_id2',
            type: 'DELETE_SUGGESTION',
        });
    });

    it('should add a new suggestion when delete with different author after an existing delete suggestion', () => {
        const date = new Date();
        const result = reducer({
            editorState: getEditorStateWithDeleteSuggestion('author_id1', date, 1, 3, 'delete'),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'delete',
                data: {
                    date: date,
                    author: 'author_id2',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(4);
        expect(selection.getEndOffset()).toEqual(4);

        for (let i = 0; i < 4; i++) {
            if (i === 0) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            } else if (i < 3) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-2']);
            }
        }

        expect(Highlights.getHighlightData(editorState, 'DELETE_SUGGESTION-2')).toEqual({
            date: date,
            author: 'author_id2',
            type: 'DELETE_SUGGESTION',
        });
    });

    it('should extend suggestion when backspace with the same author after an existing delete suggestion', () => {
        const date = new Date();
        const result = reducer({
            editorState: getEditorStateWithDeleteSuggestion('author_id', date, 1, 3, 'delete'),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'backspace',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(2);
        expect(selection.getEndOffset()).toEqual(2);

        for (let i = 0; i < 4; i++) {
            if (i > 0 && i < 3) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }
    });

    it('should extend old suggestion when delete with the same author before an existing delete suggestion', () => {
        const date = new Date();
        const result = reducer({
            editorState: getEditorStateWithDeleteSuggestion('author_id', date, 1, 3),
            suggestingMode: true,
            onChangeValue: () => ({}),
        }, {
            type: 'CREATE_DELETE_SUGGESTION',
            payload: {
                action: 'delete',
                data: {
                    date: date,
                    author: 'author_id',
                },
            },
        });

        const {editorState} = result;
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getFirstBlock();

        expect(editorState.getCurrentContent().getPlainText()).toEqual('test');
        expect(selection.getStartOffset()).toEqual(2);
        expect(selection.getEndOffset()).toEqual(2);

        for (let i = 0; i < 4; i++) {
            if (i > 0 && i < 3) {
                expect(block.getInlineStyleAt(i).toJS()).toEqual(['DELETE_SUGGESTION-1']);
            } else {
                expect(block.getInlineStyleAt(i).toJS()).toEqual([]);
            }
        }
    });
});
