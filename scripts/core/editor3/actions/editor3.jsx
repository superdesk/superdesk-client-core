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
 * @name handleEditorKeyCommand
 * @param {Object} command the name of the command
 * @return {String} action
 * @description Creates the editor key command action
 */
export function handleEditorKeyCommand(command) {
    return {
        type: 'EDITOR_KEY_COMMAND',
        payload: command
    };
}
