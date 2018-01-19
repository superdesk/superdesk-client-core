import {Editor3} from '../components/Editor3';
import {RichUtils, EditorState} from 'draft-js';
import {fromHTML} from 'core/editor3/html';
import {addMedia} from './toolbar';
import {updateHighlights} from './highlights';

/**
 * @description Contains the list of editor related reducers.
 */
const editor3 = (state = {}, action) => {
    switch (action.type) {
    case 'EDITOR_CHANGE_STATE':
        return onChange(state, action.payload.editorState, action.payload.force);
    case 'EDITOR_SET_LOCKED':
        return setLocked(state, action.payload);
    case 'EDITOR_SET_READONLY':
        return setReadOnly(state, action.payload);
    case 'EDITOR_TAB':
        return onTab(state, action.payload);
    case 'EDITOR_FORCE_UPDATE':
        return forceUpdate(state);
    case 'EDITOR_DRAG_DROP':
        return dragDrop(state, action.payload);
    case 'EDITOR_SET_CELL':
        return setCell(state, action.payload);
    case 'EDITOR_CHANGE_IMAGE_CAPTION':
        return changeImageCaption(state, action.payload);
    case 'EDITOR_SET_HTML':
        return setHTML(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name forceUpdate
 * @param {Object} editorState
 * @return {Object}
 * @description Forces an update of the editor. This is somewhat of a hack
 * based on https://github.com/facebook/draft-js/issues/458#issuecomment-225710311
 * until a better solution is found.
 */
export const forceUpdate = (state) => {
    const {editorState, spellcheckerEnabled} = state;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const decorator = editorState.getDecorator(!spellcheckerEnabled);
    const newState = EditorState.createWithContent(content, decorator);

    return {
        ...state,
        editorState: EditorState.acceptSelection(newState, selection),
    };
};

/**
 * @ngdoc method
 * @name onChange
 * @param {Object} state
 * @param {Object} editorState
 * @param {Bool} force When true, forces an editor update regardless of whether the content has changed.
 * This is used because currently it is impossible to detect changes happening solely on entity data.
 * In Draft v0.11.0 we will be able to request all entities from the content and could compare them to get a
 * more accurate result.
 * See https://draftjs.org/docs/api-reference-content-state.html#getentitymap"
 * @return {Object} returns new state
 * @description Handle the editor state has been changed event
 */
export const onChange = (state, newState, force = false) => {
    // TODO(x): Remove `force` once Draft v0.11.0 is in
    let editorState = newState, activeHighlights = {};
    let contentChanged = state.editorState.getCurrentContent() !== newState.getCurrentContent();

    if (state.allowsHighlights) {
        const selection = editorState.getSelection();
        const inlineStyle = editorState.getCurrentInlineStyle();

        ({editorState, activeHighlights} = updateHighlights(state.editorState, newState));
        editorState = EditorState.acceptSelection(editorState, selection);

        editorState = EditorState.setInlineStyleOverride(editorState, inlineStyle);
    }

    if (contentChanged || force) {
        state.onChangeValue(editorState.getCurrentContent());
    }

    if (force) {
        return forceUpdate({
            ...state,
            editorState,
            activeHighlights
        });
    }

    return {
        ...state,
        editorState,
        activeHighlights
    };
};

/**
 * @ngdoc method
 * @name onTab
 * @param {Object} event
 * @return {Object} returns new state
 * @description Handle the editor tab key pressed event
 */
const onTab = (state, e) => {
    const {editorState} = state;
    const newState = RichUtils.onTab(e, editorState, 4);

    return onChange(state, newState);
};

/**
 * @ngdoc method
 * @name dragDrop
 * @param {String} data event data
 * @return {Object} New state
 * @description Handles the dragdrop event over the editor.
 */
const dragDrop = (state, data) => {
    const media = JSON.parse(data);
    const editorState = addMedia(state.editorState, media);

    return onChange(state, editorState);
};

/**
 * @ngdoc method
 * @name setLocked
 * @param {Boolean=} locked If true, editor is locked (read-only).
 * @return {Object} New state
 * @description Handles setting the editor as active, or read-only.
 */
const setLocked = (state, locked = true) => {
    let {activeCell} = state;

    if (!locked) {
        activeCell = null;
    }

    return {...state, locked, activeCell};
};

/**
 * @ngdoc method
 * @name setReadOnly
 * @param {Boolean=} locked If true, editor is set to read-only.
 * @return {Object} New state
 * @description Handles setting the editor as active, or read-only.
 */
const setReadOnly = (state, readOnly) => ({
    ...state,
    readOnly: readOnly,
    activeCell: null,
});

/**
 * @ngdoc method
 * @name setCell
 * @param {Object} ijK Contains active block key, row (i) and col (j).
 * @return {Object} New state
 * @description Sets the currently being edited (active) table cell.
 */
const setCell = (state, {i, j, key}) => ({
    ...state,
    locked: true,
    activeCell: {i, j, key}
});

/**
 * @ngdoc method
 * @name setCell
 * @param {string} entityKey
 * @param {string} changeImageCaption
 * @return {Object} New state
 * @description Sets a new caption for the image at entityKey.
 */
const changeImageCaption = (state, {entityKey, newCaption, field}) => {
    const {editorState} = state;
    const contentState = editorState.getCurrentContent();
    const entity = contentState.getEntity(entityKey);
    let {media} = entity.getData();

    if (field === 'Title') {
        media.headline = newCaption;
    } else {
        media.description_text = newCaption;
    }

    const newContentState = contentState.replaceEntityData(entityKey, {media});
    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
    const entityDataHasChanged = true;

    return onChange(state, newEditorState, entityDataHasChanged);
};

/**
 * @ngdoc method
 * @name setHTML
 * @param {string} html
 * @description Replaces the current editor content with the given HTML. This is used
 * by the Tansa spellchecker to apply a corrected text.
 * @returns {Object}
 */
const setHTML = (state, html) => {
    const decorator = Editor3.getDecorator();
    const content = fromHTML(html);
    const editorState = EditorState.createWithContent(content, decorator);

    return onChange(state, editorState);
};

export default editor3;
