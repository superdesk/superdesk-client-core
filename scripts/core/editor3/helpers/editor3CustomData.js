import {Map} from 'immutable';

import {
    SelectionState,
    Modifier,
    EditorState,
    convertFromRaw,
} from 'draft-js';

export const editor3DataKeys = {
    MULTIPLE_HIGHLIGHTS: 'MULTIPLE_HIGHLIGHTS',
    RESOLVED_COMMENTS_HISTORY: 'RESOLVED_COMMENTS_HISTORY',
    RESOLVED_SUGGESTIONS_HISTORY: 'RESOLVED_SUGGESTIONS_HISTORY',

    // required in order to expose commnets to the server, but not couple it
    // with the client-side implementation of text-highlights
    __PUBLIC_API__comments: '__PUBLIC_API__comments',
};

export function keyValid(key) {
    return Object.keys(editor3DataKeys).includes(key);
}

export function setAllCustomDataForEditor(editorState, value) {
    const currentSelectionToPreserve = editorState.getSelection();

    let content = editorState.getCurrentContent();
    const firstBlockSelection = SelectionState.createEmpty(content.getFirstBlock().getKey());

    content = Modifier.mergeBlockData(content, firstBlockSelection, value);

    const editorStateWithDataSet = EditorState.push(editorState, content, 'change-block-data');
    const editorStateWithSelectionRestored = EditorState.acceptSelection(
        editorStateWithDataSet,
        currentSelectionToPreserve
    );

    return editorStateWithSelectionRestored;
}

export function getAllCustomDataFromEditor(editorState) {
    return editorState
        .getCurrentContent()
        .getFirstBlock()
        .getData()
        .filter((value, key) => keyValid(key));
}

export function setCustomDataForEditor(editorState, key, value) {
    if (!keyValid(key)) {
        throw new Error(`Key '${key}' is not defined`);
    }

    return setAllCustomDataForEditor(editorState, Map().set(key, value));
}

export function getCustomDataFromEditor(editorState, key) {
    if (!keyValid(key)) {
        throw new Error(`Key '${key}' is not defined`);
    }

    return editorState
        .getCurrentContent()
        .getFirstBlock()
        .getData()
        .get(key);
}

export function getCustomDataFromEditorRawState(rawState, key) {
    return getCustomDataFromEditor(EditorState.createWithContent(convertFromRaw(rawState)), key);
}