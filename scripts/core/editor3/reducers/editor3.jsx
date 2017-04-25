import {RichUtils, EditorState} from 'draft-js';
import {addImage} from './toolbar';

/**
 * @description Contains the list of editor related reducers.
 */
const editor3 = (state = {}, action) => {
    switch (action.type) {
    case 'EDITOR_CHANGE_STATE':
        return onChange(state, action.payload);
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
const onChange = (state, editorState) => {
    state.onChangeValue(editorState.getCurrentContent());

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

    state.onChangeValue(editorState.getCurrentContent());

    return {...state, editorState};
};

/**
 * @ngdoc method
 * @name setReadOnly
 * @param {Boolean=} readOnly If true, editor is set to read-only.
 * @return {Object} New state
 * @description Handles setting the editor as active, or read-only.
 */
const setReadOnly = (state, readOnly = true) => {
    let activeCell = {state};

    if (!readOnly) {
        activeCell = null;
    }

    return {...state, readOnly, activeCell};
};

/**
 * @ngdoc method
 * @name setCell
 * @param {Object} ijK Contains active block key, row (i) and col (j).
 * @return {Object} New state
 * @description Sets the currently being edited (active) table cell.
 */
const setCell = (state, {i, j, key}) => ({
    ...state,
    readOnly: true,
    activeCell: {i, j, key}
});

export default editor3;
