import {Editor3} from '../components/Editor3';
import {RichUtils, EditorState} from 'draft-js';
import {fromHTML} from 'core/editor3/html';
import {addImage} from './toolbar';
import {updateHighlights} from './highlights';

/**
 * @description Contains the list of editor related reducers.
 */
const editor3 = (state = {}, action) => {
    switch (action.type) {
    case 'EDITOR_CHANGE_STATE':
        return onChange(state, action.payload);
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
    const {editorState} = state;
    const content = editorState.getCurrentContent();
    const decorator = editorState.getDecorator();

    return {
        ...state,
        editorState: EditorState.createWithContent(content, decorator)
    };
};

/**
 * @ngdoc method
 * @name onChange
 * @param {Object} editorState
 * @return {Object} returns new state
 * @description Handle the editor state has been changed event
 */
export const onChange = (state, newState) => {
    let editorState = newState, activeHighlight = null;
    let contentChanged = state.editorState.getCurrentContent() !== newState.getCurrentContent();

    if (state.allowsHighlights) {
        ({editorState, activeHighlight} = updateHighlights(state.editorState, newState));
    }
    if (contentChanged) {
        state.onChangeValue(editorState.getCurrentContent());
    }
    return {
        ...state,
        editorState,
        activeHighlight
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
 * @param {Event} e dragdrop event
 * @return {Object} New state
 * @description Handles the dragdrop event over the editor.
 */
const dragDrop = (state, e) => {
    e.preventDefault();
    e.stopPropagation();

    const eventData = e.originalEvent.dataTransfer;
    const mediaType = eventData.types[0];
    const data = eventData.getData(mediaType);
    const img = JSON.parse(data);
    const editorState = addImage(state.editorState, img);

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
    let {img} = entity.getData();

    field === 'Title' ?
        img.headline = newCaption :
        img.description_text = newCaption;

    const newContentState = contentState.replaceEntityData(entityKey, {img});

    return onChange(state, EditorState.push(editorState, newContentState, 'change-block-data'));
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
