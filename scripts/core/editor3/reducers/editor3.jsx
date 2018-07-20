import {RichUtils, EditorState, AtomicBlockUtils, SelectionState} from 'draft-js';
import {setTansaHtml} from '../helpers/tansa';
import {addMedia} from './toolbar';

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
    case 'MERGE_ENTITY_DATA_BY_KEY':
        return mergeEntityDataByKey(state, action.payload.entityKey, action.payload.valuesToMerge);
    case 'EDITOR_CHANGE_IMAGE_CAPTION':
        return changeImageCaption(state, action.payload);
    case 'EDITOR_SET_HTML_FROM_TANSA':
        return setHtmlFromTansa(state, action.payload);
    case 'EDITOR_MOVE_BLOCK':
        return moveBlock(state, action.payload);
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
    let newState = EditorState.createWithContent(content, decorator);

    newState = EditorState.acceptSelection(newState, selection);
    newState = EditorState.set(newState, {
        undoStack: editorState.getUndoStack(),
        redoStack: editorState.getRedoStack(),
    });

    return {
        ...state,
        editorState: newState,
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
    let editorState = newState;

    let contentChanged = state.editorState.getCurrentContent() !== newState.getCurrentContent();

    if (contentChanged || force) {
        state.onChangeValue(editorState.getCurrentContent());
    }

    if (force) {
        return forceUpdate({
            ...state,
            editorState,
        });
    }

    return {
        ...state,
        editorState,
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
const dragDrop = (state, {data, blockKey}) => {
    const media = JSON.parse(data);
    const editorState = addMedia(state.editorState, media, blockKey);

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
    activeCell: {i, j, key},
});

const mergeEntityDataByKey = (state, entityKey, valuesToMerge) => {
    const {editorState} = state;
    const contentState = editorState.getCurrentContent();

    const newContentState = contentState.mergeEntityData(entityKey, valuesToMerge);
    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
    const entityDataHasChanged = true;

    return onChange(state, newEditorState, entityDataHasChanged);
};

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
 * @name setHtmlForTansa
 * @param {string} html
 * @description Replaces the current editor content with the given HTML. This is used
 * by the Tansa spellchecker to apply a corrected text.
 * @returns {Object}
 */
const setHtmlFromTansa = (state, html) => {
    const {editorState} = state;
    const newEditorState = setTansaHtml(editorState, html);

    return onChange(state, newEditorState);
};

/**
 * Move atomic block
 *
 * @param {Object} state
 * @param {String} block
 * @param {String} dest
 * @param {String} insertionMode before|after
 * @param {Bool} returnState Returns state without calling onChange
 * @return {Object}
 */
export function moveBlock(state, {block, dest, insertionMode, returnState = false}) {
    const {editorState} = state;
    const contentState = editorState.getCurrentContent();

    switch (true) {
    case block === dest:
    case !contentState.getBlockForKey(dest):
    case !contentState.getBlockForKey(block):
    case dest === contentState.getKeyBefore(block) && insertionMode === 'after':
    case dest === contentState.getKeyAfter(block) && insertionMode === 'before':
    case dest === contentState.getKeyAfter(block) && !insertionMode:
        return state; // noop
    }

    const atomicBlock = contentState.getBlockForKey(block);
    const targetRange = SelectionState.createEmpty(dest);
    const withMovedAtomicBlock = AtomicBlockUtils.moveAtomicBlock(
        editorState,
        atomicBlock,
        targetRange,
        insertionMode
    );

    if (returnState) {
        return {...state, editorState: withMovedAtomicBlock};
    }

    return onChange(state, withMovedAtomicBlock);
}

export default editor3;
