/**
 * @ngdoc method
 * @name changeEditorState
 * @param {Object} editorState
 * @return {String} action
 * @description Creates the change editor action
 */
export function changeEditorState(editorState) {
    return {
        type: 'EDITOR_CHANGE_STATE',
        payload: editorState
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
        payload: e
    };
}

/**
 * @ngdoc method
 * @name dragDrop
 * @param {Event} e
 * @return {String} action
 * @description Creates the editor drop action.
 */
export function dragDrop(e) {
    return {
        type: 'EDITOR_DRAG_DROP',
        payload: e
    };
}

/**
 * @ngdoc method
 * @name setReadOnly
 * @param {Event} v
 * @return {String} action
 * @description Dispatches the action to set the main editor as read-only.
 */
export function setLocked(v) {
    return {
        type: 'EDITOR_SET_LOCKED',
        payload: v
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
        payload: {i, j, key}
    };
}

/**
 * @ngdoc method
 * @name changeImageCaption
 * @param {string} entityKey
 * @param {string} newCaption
 * @description Change the image caption contained in the given entity key.
 * @returns {Object}
 */
export function changeImageCaption(entityKey, newCaption) {
    return {
        type: 'EDITOR_CHANGE_IMAGE_CAPTION',
        payload: {entityKey, newCaption}
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
        payload: html
    };
}
