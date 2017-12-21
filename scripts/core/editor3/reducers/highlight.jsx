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
    case 'HIGHLIGHT_COMMENT_RESOLVE':
        return resolveComment(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name resolveComment
 * @param {SelectionState} selection The selection of the comment being resolved.
 * @description Resolved the comment at selection.
 */
const resolveComment = (state, {selection}) =>
    updateComment(state, selection, (comment) => {
        comment.resolved = true;
    });

/**
 * @ngdoc method
 * @name replyComment
 * @param {SelectionState} selection The selection where the comment being replied to is located.
 * @param {Object} data The actual reply.
 * @description Applies a reply to the comment at selection, having the given data.
 */
const replyComment = (state, {selection, data}) =>
    updateComment(state, selection, (comment) => {
        comment.replies.push(data);
    });

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

/**
 * @ngdoc method
 * @name replaceHighlight
 * @param {Object} Highlight data and selection.
 * @description Attempts to update the highlight located on the selection
 * with the new data.
 */
const replaceHighlight = (state, highlight) =>
    onChange(
        state,
        updateHighlight(state.editorState, highlight)
    );

/**
 * @ngdoc method
 * @name updateComment
 * @param {Object} state The store state. Used to obtain the editor's content.
 * @param {SelectionState} selection The selection of the comment to be affected.
 * @param {Function<Comment>} fn A function that will take a comment as a parameter.
 * The function may change comment properties, for it to be submitted after its call.
 * @description Takes a function that will receive as a parameter the comment located
 * at the given selection. The function can modify the comment as it pleases, for it
 * to be updated after its call.
 */
const updateComment = (state, selection, fn) => {
    let content = state.editorState.getCurrentContent();
    let all = getHighlights(content);
    let key = JSON.stringify(selection.toJSON());
    let data = all.get(key);

    fn(data); // function mutates data

    return replaceHighlight(state, {selection, data});
};

export default highlights;
