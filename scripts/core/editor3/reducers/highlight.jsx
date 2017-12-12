import {addHighlight, removeHighlight, updateHighlight, getHighlights} from './highlights';
import {onChange} from './editor3';

const highlights = (state = {}, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_HIGHLIGHT':
        return applyHighlight(state, action.payload);
    case 'HIGHLIGHT_DELETE':
        return deleteHighlight(state, action.payload);
    case 'HIGHLIGHT_UPDATE':
        return replaceHighlight(state, action.payload);
    case 'HIGHLIGHT_COMMENT_REPLY':
        return replyComment(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name replyComment
 * @param {SelectionState} selection The selection where the comment being replied to is located.
 * @param {Object} data The actual reply.
 * @description Applies a reply to the comment at selection, having the given data.
 */
const replyComment = (state, {selection, data}) => {
    const content = state.editorState.getCurrentContent();
    const all = getHighlights(content);
    const key = JSON.stringify(selection.toJSON());
    const comment = all.get(key);

    comment.replies.push(data);

    return replaceHighlight(state, {
        selection: selection,
        data: comment,
    });
};

/**
 * @ngdoc method
 * @name applyHighlight
 * @param {Object} Highlight data and selection.
 * @description Applies the given highlight to the given selection.
 */
const applyHighlight = (state, {data, selection}) => onChange(
    state,
    addHighlight(state.editorState, selection, data)
);

/**
 * @ngdoc method
 * @name deleteHighlight
 * @param {Object} Highlight data and selection.
 * @description Deletes the given highlight.
 */
const deleteHighlight = (state, highlight) => onChange(
    state,
    removeHighlight(state.editorState, highlight)
);

/**
 * @ngdoc method
 * @name replaceHighlight
 * @param {Object} Highlight data and selection.
 * @description Attempts to update the highlight located on the selection
 * with the new data.
 */
const replaceHighlight = (state, highlight) => onChange(
    state,
    updateHighlight(state.editorState, highlight)
);

export default highlights;
