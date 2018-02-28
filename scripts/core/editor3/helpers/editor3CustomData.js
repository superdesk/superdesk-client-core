import {Map} from 'immutable';

import {
    SelectionState,
    Modifier,
    EditorState,
} from 'draft-js';

export const editor3DataKeys = {
    MULTIPLE_HIGHLIGHTS_STORAGE_KEY: 'multiple-highlights',
    RESOLVED_COMMENTS_HISTORY: 'resolved-comments'
};

export function keyValid(key) {
    return Object.keys(editor3DataKeys).includes(key);
}

export function setCustomDataForEditor(editorState, key, value) {
    if (keyValid(key)) {
        throw new Error(`Key '${key}' is not defined`);
    }

    const currentSelectionToPreserve = editorState.getSelection();

    let content = editorState.getCurrentContent();
    const firstBlockSelection = SelectionState.createEmpty(content.getFirstBlock().getKey());

    content = Modifier.mergeBlockData(content, firstBlockSelection, Map().set(key, value));

    const editorStateWithDataSet = EditorState.push(editorState, content, 'change-inline-style');
    const editorStateWithSelectionRestored = EditorState.forceSelection(
        editorStateWithDataSet,
        currentSelectionToPreserve
    );

    return editorStateWithSelectionRestored;
}

export function getCustomDataFromEditor(editorState, key) {
    if (keyValid(key)) {
        throw new Error(`Key '${key}' is not defined`);
    }

    return editorState
        .getCurrentContent()
        .getFirstBlock()
        .getData()
        .get(key);
}