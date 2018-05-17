import {EditorState} from 'draft-js';
import reducer from '../suggestions';

describe('editor3.reducers.suggestion.TOGGLE_SUGGESTING_MODE', () => {
    it('TOGGLE_SUGGESTING_MODE - activate', () => {
        const editorState = EditorState.createEmpty();
        const suggestingMode = false;

        const result = reducer({
            editorState: editorState,
            suggestingMode: suggestingMode,
        }, {
            type: 'TOGGLE_SUGGESTING_MODE',
        });

        expect(result).toEqual({
            editorState: editorState,
            suggestingMode: true,
        });
    });

    it('TOGGLE_SUGGESTING_MODE - deactivate', () => {
        const editorState = EditorState.createEmpty();
        const suggestingMode = true;

        const result = reducer({
            editorState: editorState,
            suggestingMode: suggestingMode,
        }, {
            type: 'TOGGLE_SUGGESTING_MODE',
        });

        expect(result).toEqual({
            editorState: editorState,
            suggestingMode: false,
        });
    });
});