import {addHighlight, removeHighlight} from './highlights';
import {onChange} from './editor3';

const highlights = (state = {}, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_HIGHLIGHT':
        return applyHighlight(state, action.payload);
    case 'HIGHLIGHT_DELETE':
        return deleteHighlight(state, action.payload);
    default:
        return state;
    }
};
/**
 * @ngdoc method
 * @name applyHighlight
 * @param {Object} Highlight data and selection.
 * @description Applies the given highlight to the given selection.
 */
const applyHighlight = (state, {data, selection}) =>
    onChange(
        state,
        addHighlight(state.editorState, selection, data)
    );

/**
 * @ngdoc method
 * @name deleteHighlight
 * @param {Object} Highlight data and selection.
 * @description Deletes the given highlight.
 */
const deleteHighlight = (state, highlight) =>
    onChange(
        state,
        removeHighlight(state.editorState, highlight)
    );

export default highlights;
