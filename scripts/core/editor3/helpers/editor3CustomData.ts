import {Map} from 'immutable';
import {
    SelectionState,
    Modifier,
    EditorState,
    convertFromRaw,
} from 'draft-js';
import {fieldsMetaKeys, getFieldMetadata} from './fieldsMeta';
import {
    getDraftSelectionForEntireContent,
} from './getDraftSelectionForEntireContent';
import {
    getHighlightData,
    getHighlightTypeFromStyleName,
    initializeHighlights,
    styleNameBelongsToHighlight,
} from './highlights';
import {
    getUniqueStyleNamesInDraftSelection,
} from './getUniqueStyleNamesInDraftSelection';
import {toHTML} from '..';
import {highlightsConfig} from '../highlightsConfig';

function getCustomMetadataFromContentState(contentState, highlightType) {
    const editorState = initializeHighlights(EditorState.createWithContent(contentState));

    const allStyleNames = getUniqueStyleNamesInDraftSelection(
        editorState,
        getDraftSelectionForEntireContent(editorState)
    );

    return allStyleNames
        .filter(styleNameBelongsToHighlight)
        .filter((h) => getHighlightTypeFromStyleName(h) === highlightType)
        .map((styleName) => ({
            styleName: styleName,
            obj: getHighlightData(editorState, styleName),
        }));
}

function getAnnotationsFromHighlights(highlights) {
    return highlights.map(({styleName, obj}, index) => ({
        styleName: styleName,
        id: index + 1, // count from 1
        index: index + 1, // count from 1
        type: obj.data.annotationType,
        body: toHTML(convertFromRaw(JSON.parse(obj.data.msg))),
    }));
}

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

export function getAnnotationsFromItem(item, field) {
    const highlights = getCustomMetadata(item, field, highlightsConfig.ANNOTATION.type);

    return getAnnotationsFromHighlights(highlights);
}

export function getAnnotationsFromContentState(contentState) {
    const highlights = getCustomMetadataFromContentState(contentState, highlightsConfig.ANNOTATION.type);

    return getAnnotationsFromHighlights(highlights);
}

export function getCustomMetadata(item, field, highlightType) {
    const contentStateRaw = getFieldMetadata(item, field, fieldsMetaKeys.draftjsState);

    if (contentStateRaw) {
        const contentState = convertFromRaw(contentStateRaw);

        return getCustomMetadataFromContentState(contentState, highlightType);
    }

    return [];
}
