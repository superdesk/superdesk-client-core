import React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import {EditorState, SelectionState} from 'draft-js';
import {HighlightsPopup} from '../HighlightsPopup';

describe('editor3.components.HighlightsPopup', () => {
    let placeholder: HTMLDivElement;

    beforeEach(() => {
        jasmine.clock().install();
        placeholder = document.createElement('div');
        placeholder.id = 'react-placeholder';
        document.body.appendChild(placeholder);
    });

    afterEach(() => {
        unmountComponentAtNode(placeholder);
        placeholder.remove();
        jasmine.clock().uninstall();
    });

    function updateEditor(hasFocus: boolean): void {
        const editorState = EditorState.createEmpty();
        const selection = editorState.getSelection().merge({hasFocus}) as SelectionState;

        new HighlightsPopup({
            editorState: EditorState.acceptSelection(editorState, selection),
            onChange: () => { /* no-op */ },
            editorNode: React.createRef(),
            highlightsManager: {styleNameBelongsToHighlight: () => false},
        }).componentDidUpdate();

        jasmine.clock().tick(1);
    }

    it('keeps a popup rendered by another editor when updating without focus', () => {
        render(<div data-test-id="other-editor-popup" />, placeholder);

        updateEditor(false);

        expect(placeholder.querySelector('[data-test-id="other-editor-popup"]')).not.toBeNull();
    });

    it('closes a popup rendered by another editor once it gets the focus', () => {
        render(<div data-test-id="other-editor-popup" />, placeholder);

        updateEditor(true);

        expect(placeholder.querySelector('[data-test-id="other-editor-popup"]')).toBeNull();
    });
});
