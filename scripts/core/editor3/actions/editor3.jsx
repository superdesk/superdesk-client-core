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
