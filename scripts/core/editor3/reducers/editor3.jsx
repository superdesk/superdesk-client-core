import {RichUtils} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Editor3 Reducers
 * @description Contains the list of editor related reducers.
 */
const editor3 = (state = {}, action) => {
    switch (action.type) {
    case 'EDITOR_CHANGE_STATE':
        return onChange(state, action.payload);
    case 'EDITOR_TAB':
        return onTab(state, action.payload);
    case 'EDITOR_KEY_COMMAND':
        return handleKeyCommand(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name Editor3#onChange
 * @param {Object} editorState
 * @param {bool} focus
 * @return {Object} returns new state
 * @description Handle the editor state has been changed event
 */
const onChange = (state, editorState) => {
    const {onChangeValue} = state;

    onChangeValue(stateToHTML(editorState.getCurrentContent()));
    return Object.assign({}, state, {editorState});
};

/**
 * @ngdoc method
 * @name Editor3 Reducers#onTab
 * @param {Object} event
 * @return {Object} returns new state
 * @description Handle the editor tab key pressed event
 */
const onTab = (state, e) => {
    const maxDepth = 4;
    const {editorState} = state;
    const newEditorState = RichUtils.onTab(e, editorState, maxDepth);

    return onChange(state, newEditorState ? newEditorState : editorState);
};

/**
 * @ngdoc method
 * @name Editor3 Reducers#handleKeyCommand
 * @param {String} command
 * @return {Object} returns new state
 * @description Handle the editor key pressed event
 */
const handleKeyCommand = (state, command) => {
    const {editorState} = state;
    const newEditorState = RichUtils.handleKeyCommand(editorState, command);

    return onChange(state, newEditorState ? newEditorState : editorState);
};

export default editor3;