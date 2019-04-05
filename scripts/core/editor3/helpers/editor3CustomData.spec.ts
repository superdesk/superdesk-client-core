import {ignoreInternalAnnotationFields} from '../store';
import inputJson from './editor3CustomData.snapshot.input.json';
import outputJson from './editor3CustomData.snapshot.output.json';
import {convertFromRaw, EditorState, ContentState, SelectionState, Modifier} from 'draft-js';

import {getAnnotationsFromContentState, setAllCustomDataForEditor} from './editor3CustomData';

it('should generate ids for annotations in order they appear in the content', () => {
    const contentState = convertFromRaw(inputJson);
    const result = getAnnotationsFromContentState(contentState);

    expect(
        JSON.stringify(ignoreInternalAnnotationFields(result)),
    ).toBe(
        JSON.stringify(ignoreInternalAnnotationFields(outputJson)),
    );
});

describe('setAllCustomDataForEditor', () => {
    it('should not alter the selection', () => {
        const contentState = ContentState.createFromText('test');

        const selectionState = SelectionState.createEmpty(contentState.getFirstBlock().getKey()).merge({
            anchorOffset: 3,
            focusOffset: 3,
        }) as SelectionState;

        const editorState1 = EditorState.acceptSelection(
            EditorState.createWithContent(contentState),
            selectionState,
        );

        const contentState2 = Modifier.insertText(
            editorState1.getCurrentContent(),
            editorState1.getSelection(),
            'zzz',
        );
        const editorState2 = EditorState.push(editorState1, contentState2, 'insert-characters');

        expect(editorState2.getCurrentContent().getFirstBlock().getText()).toBe('teszzzt');
        expect(editorState2.getSelection().getAnchorOffset()).toBe(6);
        expect(editorState2.getSelection().getFocusOffset()).toBe(6);

        const editorState3 = setAllCustomDataForEditor(editorState2, {testData: 'str'});
        expect(editorState3.getSelection().getAnchorOffset()).toBe(6);
        expect(editorState3.getSelection().getFocusOffset()).toBe(6);
        expect(
            JSON.stringify(editorState3.getCurrentContent().getFirstBlock().getData().toJS()),
        ).toBe(`{"testData":"str"}`);

        const editorState4 = EditorState.undo(editorState3);
        expect(editorState4.getCurrentContent().getFirstBlock().getText()).toBe('test');
        expect(editorState4.getSelection().getAnchorOffset()).toBe(3);
        expect(editorState4.getSelection().getFocusOffset()).toBe(3);

        const editorState5 = EditorState.redo(editorState3);
        expect(editorState5.getSelection().getAnchorOffset()).toBe(6);
        expect(editorState5.getSelection().getFocusOffset()).toBe(6);
    });
});
