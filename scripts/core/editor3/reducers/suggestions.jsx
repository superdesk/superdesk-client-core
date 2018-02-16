import {EditorState, Modifier, RichUtils} from 'draft-js';
import {onChange} from './editor3';
import {getEntityKeyByOffset, getCharByOffset} from '../helpers/entity';
import {getEntityKey, getEntity, setEntity, deleteEntity} from '../helpers/composite-entity';
import {acceptedInlineStyles} from '../helpers/inlineStyles';

const suggestions = (state = {}, action) => {
    switch (action.type) {
    case 'TOGGLE_SUGGESTING_MODE':
        return toggleSuggestingMode(state);
    case 'CREATE_ADD_SUGGESTION':
        return createAddSuggestion(state, action.payload);
    case 'CREATE_DELETE_SUGGESTION':
        return createDeleteSuggestion(state, action.payload);
    case 'PASTE_ADD_SUGGESTION':
        return pasteAddSuggestion(state, action.payload);
    case 'ACCEPT_SUGGESTION':
        return processSuggestion(state, action.payload, true);
    case 'REJECT_SUGGESTION':
        return processSuggestion(state, action.payload, false);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name toggleSuggestingMode
 * @param {Object} state
 * @return {Object} returns new state
 * @description Disable/enable the suggesting mode.
 */
const toggleSuggestingMode = (state) => {
    const {suggestingMode} = state;

    return {
        ...state,
        suggestingMode: !suggestingMode
    };
};

/**
 * @ngdoc method
 * @name createAddSuggestion
 * @param {Object} state
 * @param {String} text - the suggestion added text
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type ADD.
 */
const createAddSuggestion = (state, {text, data}) => {
    let {editorState} = state;

    editorState = deleteCurrentSelection(editorState, data);

    for (let i = 0; i < text.length; i++) {
        // for every character from inserted text apply add suggestion
        editorState = setAddSuggestionForCharacter(editorState, data, text[i]);
    }

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name createDeleteSuggestion
 * @param {Object} state
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type DELETE.
 */
const createDeleteSuggestion = (state, {action, data}) => {
    let {editorState} = state;
    const selection = editorState.getSelection();
    const selectionLength = selection.getEndOffset() - selection.getStartOffset();

    if (selectionLength === 0) {
        if (action === 'backspace') {
            editorState = changeEditorSelection(editorState, -1, 0, false);
        } else {
            editorState = changeEditorSelection(editorState, 0, 1, false);
        }
    }
    editorState = deleteCurrentSelection(editorState, data);

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name pasteAddSuggestion
 * @param {Object} state
 * @param {Object} content - the suggestion added content
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Add a new suggestion of type ADD based on content.
 */
const pasteAddSuggestion = (state, {content, data}) => {
    let {editorState} = state;
    const blockMap = content.getBlockMap();

    editorState = deleteCurrentSelection(editorState, data);

    blockMap.forEach((block) => {
        if (block.getType() !== 'atomic') {
            const text = block.getText();
            const characterMetadataList = block.getCharacterList();
            let inlineStyle;

            characterMetadataList.forEach((characterMetadata, i) => {
                inlineStyle = acceptedInlineStyles.filter((style) => characterMetadata.hasStyle(style));
                editorState = setAddSuggestionForCharacter(editorState, data, text[i], inlineStyle);
            });
        } else {
            // TODO: insert block
        }
    });

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name processSuggestion
 * @param {Object} state
 * @param {Object} selection - the selection of suggestion
 * @param {Boolean} accepted - the suggestion is accepted
 * @return {Object} returns new state
 * @description Accept or reject the suggestions in the selection.
 */
const processSuggestion = (state, {selection}, accepted) => {
    const types = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
    const start = selection.getStartOffset();
    const end = selection.getEndOffset();
    let {editorState} = state;
    let content = editorState.getCurrentContent();
    let entityKey;
    let entity;
    let type;

    for (let i = end - start - 1; i >= 0; i--) {
        entityKey = getEntityKey(content, getEntityKeyByOffset(content, selection, i), types);
        if (entityKey == null) {
            continue;
        }

        entity = content.getEntity(entityKey);
        if (entity == null) {
            continue;
        }
        type = entity.get('type');

        const applySuggestion = type === 'ADD_SUGGESTION' && accepted || type === 'DELETE_SUGGESTION' && !accepted;
        const newSelection = selection.merge({
            anchorOffset: start + i + (applySuggestion ? 0 : 1),
            focusOffset: start + i + (applySuggestion ? 0 : 1),
            isBackward: false
        });

        editorState = EditorState.acceptSelection(editorState, newSelection);

        if (applySuggestion) {
            // keep character and clean suggestion style and entity
            editorState = resetSuggestion(editorState, type);
        } else {
            // delete current character
            editorState = deleteCharacter(editorState);
        }
    }

    return onChange(state, editorState, true);
};

/**
 * @ngdoc method
 * @name deleteCurrentSelection
 * @param {Object} editorState
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Set the delete suggestion for current editor selection.
 */
const deleteCurrentSelection = (editorState, data) => {
    const selection = editorState.getSelection();
    const selectionLength = selection.getEndOffset() - selection.getStartOffset();
    let newState = editorState;

    if (selectionLength !== 0) {
        // if text is selected, apply delete suggestion for every selected character
        newState = changeEditorSelection(newState, selectionLength, 0, false);
        for (let i = 0; i < selectionLength; i++) {
            newState = setDeleteSuggestionForCharacter(newState, data);
        }
    }

    return newState;
};

/**
 * @ngdoc method
 * @name setAddSuggestionForCharacter
 * @param {Object} state
 * @param {String} text - the suggestion added text
 * @param {Object} inlineStyle - the style for the text
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Set the add suggestion for current character.
 *   On suggestion mode:
 *   1. next neighbor is 'delete suggestion' with same user and the same char as added one -> reset delete entity
 *       1.1. if both neighbors are 'new suggestion' and has the same user -> concatenate them?
 *   2. at least one of neighbors is 'new suggestion' and has same user -> set the same entity
 *   3. other cases -> add new 'new suggestion'
 *       3.1 if the neighbors had the same entity -> split the entity/group?
 *   Not on suggestion mode:
 *   1. both are 'new suggestion' neighbors with the same user -> set same entity
 */
const setAddSuggestionForCharacter = (editorState, data, text, inlineStyle = null, entityKey = null) => {
    const crtInlineStyle = inlineStyle || editorState.getCurrentInlineStyle();
    const {key: beforeKey, entity: beforeEntity} = getKeyAndEntityAtOffset(editorState, -1);
    const {key: currentKey, entity: currentEntity} = getKeyAndEntityAtOffset(editorState, 0);
    let selection = editorState.getSelection();
    let content = editorState.getCurrentContent();
    const currentChar = getCharByOffset(content, selection, 0);
    let newState = editorState;

    if (currentChar === text && currentEntity != null
        && currentEntity.get('type') === 'DELETE_SUGGESTION'
        && currentEntity.get('data').author === data.author) {
        // if next character is the same as the new one and is delete suggestion -> reset entity
        newState = resetSuggestion(newState, 'DELETE_SUGGESTION');
        return newState;
    }

    content = Modifier.insertText(content, selection, text);
    newState = EditorState.push(newState, content, 'insert-characters');
    newState = changeEditorSelection(newState, -1, 0, false);
    newState = applyStyleForSuggestion(newState, crtInlineStyle, 'ADD_SUGGESTION');
    selection = newState.getSelection();
    content = newState.getCurrentContent();

    if (beforeEntity != null && beforeEntity.get('type') === 'ADD_SUGGESTION'
        && beforeEntity.get('data').author === data.author) {
        // if previous character is an add suggestion of the same user, set the same entity
        content = setEntity(content, selection, beforeKey, 'ADD_SUGGESTION');
    } else if (currentEntity != null && currentEntity.get('type') === 'ADD_SUGGESTION'
        && currentEntity.get('data').author === data.author) {
        // if next character is an add suggestion of the same user, set the same entity
        content = setEntity(content, selection, currentKey, 'ADD_SUGGESTION');
    } else {
        // create a new add entity
        content = addNewSuggestionEntity(content, selection, 'ADD_SUGGESTION', data);
    }

    newState = EditorState.push(newState, content, 'insert-characters');
    newState = changeEditorSelection(newState, 1, 0, true);

    return newState;
};

/**
 * @ngdoc method
 * @name createDeleteSuggestion
 * @param {Object} state
 * @param {Object} data - info about the author of suggestion
 * @return {Object} returns new state
 * @description Set the delete suggestion for current character.
 *    On suggestion mode:
 *   1. if previous neighbor is 'new suggestion' with the same user -> delete char
 *       1.1. if both new neighbors are 'new suggestion' and has the same user -> concatenate them?
 *   2. at least one of neighbors is 'delete suggestion' and has same user -> set the same entity
 *   3. other cases -> add new 'delete suggestion'
 *       3.1 if the neighbors had the same entity -> split the entity/group?
 *   Not on suggestion mode:
 *   1. both are 'delete suggestion' neighbors with the same user -> set same entity
 */
const setDeleteSuggestionForCharacter = (editorState, data) => {
    const {entity: currentEntity} = getKeyAndEntityAtOffset(editorState, -1);

    if (currentEntity != null && currentEntity.get('type') === 'DELETE_SUGGESTION') {
        // if current character is already marked as a delete suggestion, skip
        return changeEditorSelection(editorState, -1, -1, true);
    }

    if (currentEntity != null && currentEntity.get('type') === 'ADD_SUGGESTION' &&
        currentEntity.get('data').author === data.author) {
        // if current character already a suggestion of current user, delete the character
        return deleteCharacter(editorState);
    }

    const {key: beforeKey, entity: beforeEntity} = getKeyAndEntityAtOffset(editorState, -2);
    const {key: afterKey, entity: afterEntity} = getKeyAndEntityAtOffset(editorState, 0);
    let newState = changeEditorSelection(editorState, -1, 0, false);
    let content = newState.getCurrentContent();
    let selection = newState.getSelection();

    if (beforeEntity != null && beforeEntity.get('type') === 'DELETE_SUGGESTION'
        && beforeEntity.get('data').author === data.author) {
        // if previous character is a delete suggestion of the same user, set the same entity
        content = setEntity(content, selection, beforeKey, 'DELETE_SUGGESTION');
    } else if (afterEntity != null && afterEntity.get('type') === 'DELETE_SUGGESTION'
        && afterEntity.get('data').author === data.author) {
        // if next character is a delete suggestion of the same user, set the same entity
        content = setEntity(content, selection, afterKey, 'DELETE_SUGGESTION');
    } else {
        // create a new delete entity
        content = addNewSuggestionEntity(content, selection, 'DELETE_SUGGESTION', data);
    }

    newState = EditorState.push(newState, content, 'apply-entity');
    newState = RichUtils.toggleInlineStyle(newState, 'DELETE_SUGGESTION');
    return changeEditorSelection(newState, 0, -1, true);
};

/**
 * @ngdoc method
 * @name applyStyleForSuggestion
 * @param {Object} editorState
 * @param {Objest} inlineStyle
 * @param {String} type
 * @return {Object} returns new state
 * @description Apply the style for current selection.
 */
const applyStyleForSuggestion = (editorState, inlineStyle, type) => {
    let newState = editorState;

    inlineStyle.forEach((style) => {
        if (style !== 'ADD_SUGGESTION' && style !== 'DELETE_SUGGESTION') {
            newState = RichUtils.toggleInlineStyle(newState, style);
        }
    });

    return RichUtils.toggleInlineStyle(newState, type);
};

/**
 * @ngdoc method
 * @name resetSuggestion
 * @param {Object} editorState
 * @param {String} type
 * @return {Object} returns new state
 * @description For type suggestion reset both style and entity for
 * current character position.
 */
const resetSuggestion = (editorState, type) => {
    let newState = editorState;
    let selection;
    let content;

    newState = changeEditorSelection(newState, 0, 1, false);
    newState = RichUtils.toggleInlineStyle(newState, type);

    content = newState.getCurrentContent();
    selection = newState.getSelection();

    content = deleteEntity(content, selection, type);
    newState = EditorState.push(newState, content, 'apply-entity');
    newState = changeEditorSelection(newState, 1, 0, false);

    return newState;
};

/**
 * @ngdoc method
 * @name deleteCharacter
 * @param {Object} editorState
 * @return {Object} returns new state
 * @description Delete the current character.
 */
const deleteCharacter = (editorState) => {
    let content;
    let selection;
    let newState;

    newState = changeEditorSelection(editorState, -1, 0, false);
    content = newState.getCurrentContent();
    selection = newState.getSelection();

    content = Modifier.removeRange(content, selection, 'forward');
    newState = EditorState.push(newState, content, 'backspace-character');

    return changeEditorSelection(newState, 0, 0, true);
};

/**
 * @ngdoc method
 * @name deleteCharacter
 * @param {Object} editorState
 * @return {Object} returns new state
 * @description Create a new entity of specified type and associate
 * it to the current selection.
 */
const addNewSuggestionEntity = (content, selection, type, data) => {
    const newContent = content.createEntity(type, 'MUTABLE', data);
    const key = newContent.getLastCreatedEntityKey();

    return setEntity(newContent, selection, key, type);
};

/**
 * @ngdoc method
 * @name changeEditorSelection
 * @param {Object} editorState
 * @param {Integer} startOffset - the anchor offset relative to current start offset
 * @param {Integer} endOffset - the focus offset relative to current end offset
 * @param {Boolean} force - apply accept or force selection
 * @return {Object} returns new state
 * @description Change the current editor selection.
 */
const changeEditorSelection = (editorState, startOffset, endOffset, force) => {
    const selection = editorState.getSelection();
    const newSelection = selection.merge({
        anchorOffset: selection.getStartOffset() + startOffset,
        focusOffset: selection.getEndOffset() + endOffset,
        isBackward: false
    });

    if (force) {
        return EditorState.forceSelection(editorState, newSelection);
    }

    return EditorState.acceptSelection(editorState, newSelection);
};

/**
 * @ngdoc method
 * @name getKeyAndEntityAtOffset
 * @param {Object} editorState
 * @param {Integer} offset - the offset relatively to current position
 * @return {Object} returns key and entity
 * specified position
 * @description Calculate the new position and return key and entity of suggestion type.
 */
const getKeyAndEntityAtOffset = (editorState, offset) => {
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const types = ['DELETE_SUGGESTION', 'ADD_SUGGESTION'];
    let tmpKey = null;
    let key = null;
    let entity = null;

    tmpKey = getEntityKeyByOffset(content, selection, offset);
    if (tmpKey != null) {
        key = getEntityKey(content, tmpKey, types);
        entity = getEntity(content, tmpKey, types);
    }

    return {key, entity};
};

export default suggestions;
