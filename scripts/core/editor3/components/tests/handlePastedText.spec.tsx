import React from 'react';
import {EditorState, ContentState} from 'draft-js';
import {cursorAtEndPosition, cursorAtPosition} from './utils';
import {Editor3Component} from '../Editor3Component';
import {insertContentInState} from '../handlePastedText';

const stubForHighlights = {
    highlightsManager: {
        styleMap: {}
    }
};

describe('editor3.handlePastedText', () => {
    it('should insert text without selection', () => {
        const editorState = EditorState.createWithContent(
            ContentState.createFromText('paste before this')
        );
        const pastedContent = ContentState.createFromText('some text ');

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('some text paste before this');
    });

    it('should insert text with selection at the end', () => {
        let editorState = EditorState.createWithContent(
            ContentState.createFromText('paste after this ')
        );
        const pastedContent = ContentState.createFromText('some text');

        editorState = cursorAtEndPosition(editorState);

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('paste after this some text');
    });

    it('should insert text with selection in the middle', () => {
        let editorState = EditorState.createWithContent(
            ContentState.createFromText('paste after this!')
        );
        const pastedContent = ContentState.createFromText(' some text');

        editorState = cursorAtPosition(editorState, 16);

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('paste after this some text!');
    });

    it('should keep undo/redo history consistent', () => {
        let editorState = EditorState.createWithContent(
            ContentState.createFromText('paste after this')
        );
        const pastedContent = ContentState.createFromText(' some text');

        editorState = cursorAtEndPosition(editorState);

        const editorAfterPaste = insertContentInState(editorState, pastedContent, []);
        const [text] = editorAfterPaste.getCurrentContent().getBlocksAsArray()
            .map((b) => b.getText());

        expect(text).toBe('paste after this some text');

        const cursorAfterPaste = editorAfterPaste.getSelection().getEndOffset();
        const editorAfterUndo = EditorState.undo(editorAfterPaste);

        const cursorAfterUndo = editorAfterUndo.getSelection().getEndOffset();
        const editorAfterRedo = EditorState.redo(EditorState.redo(editorAfterUndo));
        const cursorAfterRedo = editorAfterRedo.getSelection().getEndOffset();

        expect(cursorAfterPaste).toBe(26);
        expect(cursorAfterUndo).toBe(16);
        expect(cursorAfterRedo).toBe(26);
    });
});
