import {insertMedia} from './toolbar';

/**
 * @ngdoc method
 * @name changeEditorState
 * @param {Object} editorState
 * @param {force} force update
 * @return {String} action
 * @description Creates the change editor action
 */
export function changeEditorState(editorState, force) {
    return {
        type: 'EDITOR_CHANGE_STATE',
        payload: {editorState, force},
    };
}

/**
 * @ngdoc method
 * @name forceUpdate
 * @return {String} action
 * @description Causes the editor to force update. This is used by the spellchecker
 * to cause the editor to re-render its decorators based on new information retrieved
 * in dictionaries. Use of this method should be avoided.
 */
export function forceUpdate() {
    return {type: 'EDITOR_FORCE_UPDATE'};
}

/**
 * @ngdoc method
 * @name handleEditorTab
 * @param {Object} e on tab event
 * @return {String} action
 * @description Creates the change editor action
 */
export function handleEditorTab(e) {
    return {
        type: 'EDITOR_TAB',
        payload: e,
    };
}

/**
 * @ngdoc method
 * @name dragDrop
 * @param {DataTransfer} transfer
 * @return {String} mediaType
 * @description Creates the editor drop action.
 */
export function dragDrop(transfer, mediaType) {
    if (mediaType === 'Files') {
        return insertMedia(transfer.files);
    }

    return {
        type: 'EDITOR_DRAG_DROP',
        payload: transfer.getData(mediaType),
    };
}

/**
 * @ngdoc method
 * @name setLocked
 * @param {Event} v
 * @return {String} action
 * @description Dispatches the action to set the main editor as locked. The main editor
 * is locked when other atomic blocks are edited that manage their own editor, such
 * as tables or image descriptions.
 */
export function setLocked(v) {
    return {
        type: 'EDITOR_SET_LOCKED',
        payload: v,
    };
}

/**
 * @ngdoc method
 * @name setReadOnly
 * @param {Event} v
 * @return {String} action
 * @description Dispatches the action to set the main editor as read-only. This is
 * mainly used externally to allow bi-directional binding of the readOnly attribute
 * on the Angular directive. Not used in React.
 */
export function setReadOnly(v) {
    return {
        type: 'EDITOR_SET_READONLY',
        payload: v,
    };
}

/**
 * @ngdoc method
 * @name setActiveCell
 * @description Sets the active table and cell inside the editor.
 */
export function setActiveCell(i, j, key) {
    return {
        type: 'EDITOR_SET_CELL',
        payload: {i, j, key},
    };
}

/**
 * @ngdoc method
 * @name changeImageCaption
 * @param {string} entityKey
 * @param {string} newCaption
 * @param {string} field
 * @description Change the image caption contained in the given entity key.
 * @returns {Object}
 */
export function changeImageCaption(entityKey, newCaption, field) {
    return {
        type: 'EDITOR_CHANGE_IMAGE_CAPTION',
        payload: {entityKey, newCaption, field},
    };
}

/**
 * @ngdoc method
 * @name setHTML
 * @param {string} html
 * @description Replaces the current editor content with the given HTML. This is used
 * by the Tansa spellchecker to apply a corrected text.
 * @returns {Object}
 */
export function setHTML(html) {
    return {
        type: 'EDITOR_SET_HTML',
        payload: html,
    };
}

/**
 * Move one block after another
 *
 * @param {String} block
 * @param {String} dest
 * @return {Object}
 */
export function moveBlock(block, dest, insertionMode) {
    return {
        type: 'EDITOR_MOVE_BLOCK',
        payload: {block, dest, insertionMode},
    };
}
