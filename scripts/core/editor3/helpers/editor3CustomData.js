import {Map} from 'immutable';

import {
    SelectionState,
    Modifier,
    EditorState,
} from 'draft-js';

export const editor3DataKeys = {
    MULTIPLE_HIGHLIGHTS: 'MULTIPLE_HIGHLIGHTS',
    RESOLVED_COMMENTS_HISTORY: 'RESOLVED_COMMENTS_HISTORY',
    RESOLVED_SUGGESTIONS_HISTORY: 'RESOLVED_SUGGESTIONS_HISTORY'
};

export function keyValid(key) {
    return Object.keys(editor3DataKeys).includes(key);
}

export function setCustomDataForEditor(editorState, key, value) {
    if (!keyValid(key)) {
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

function getDataFromArrayState(editorStateArr, key) {
    const editorState = editorStateArr[0];
    const firstBlock = editorState.blocks[0];

    return firstBlock.data[key];
}

export function getCustomDataFromEditor(editorState, key) {
    if (!keyValid(key)) {
        throw new Error(`Key '${key}' is not defined`);
    }

    // If it's not a draftjs state, it's an array
    if (Array.isArray(editorState)) {
        return getDataFromArrayState(editorState, key);
    }

    return editorState
        .getCurrentContent()
        .getFirstBlock()
        .getData()
        .get(key);
}
