import {RichUtils, EditorState, Entity, AtomicBlockUtils} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';

/**
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
    case 'EDITOR_FORCE_UPDATE':
        return forceUpdate(state);
    case 'EDITOR_DRAG_DROP':
        return dragDrop(state, action.payload);
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
const forceUpdate = (state) => {
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
 * @param {bool} focus
 * @return {Object} returns new state
 * @description Handle the editor state has been changed event
 */
const onChange = (state, editorState) => {
    const {onChangeValue} = state;

    onChangeValue(stateToHTML(editorState.getCurrentContent()));
    return {...state, editorState};
};

/**
 * @ngdoc method
 * @name onTab
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
 * @name handleKeyCommand
 * @param {String} command
 * @return {Object} returns new state
 * @description Handle the editor key pressed event
 */
const handleKeyCommand = (state, command) => {
    const {editorState} = state;
    const newEditorState = RichUtils.handleKeyCommand(editorState, command);

    return onChange(state, newEditorState ? newEditorState : editorState);
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
    const entityKey = Entity.create('IMAGE', 'IMMUTABLE', {img});
    const editorState = AtomicBlockUtils.insertAtomicBlock(
        state.editorState,
        entityKey,
        ' '
    );

    return {...state, editorState};
};

export default editor3;
