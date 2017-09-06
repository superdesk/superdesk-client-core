// TODO(gbbr): Perhaps we can store these in the EntityMap once 0.11 is out?
// It seems that the first block key and data never change as far as it has
// been tested. As long as that remains true, storing comments in the metadata
// of the first block is safe.

import {SelectionState, Modifier, EditorState} from 'draft-js';
import {Map} from 'immutable';

/**
 * @typedef Comment
 * @property {string} msg The comment body
 */

/**
 * @description Returns all the comments in the given content.
 * @param {ContentState} content
 * @returns {Map<SelectionState, Comment>}
 */
export const getComments = (content) => content.getFirstBlock().getData();

/**
 * @description Adds a new comment to the editor state for the given selection
 * and data. It returns a new editor state with the changes applied.
 * @param {EditorState} editorState
 * @param {SelectionState} selection
 * @param {Comment} data
 * @returns {EditorState}
 */
export const addComment = (editorState, selection, data) => {
    const content = editorState.getCurrentContent();
    const firstBlock = SelectionState.createEmpty(content.getFirstBlock().getKey());
    const blockData = Map().set(JSON.stringify(selection.toJSON()), data);

    let contentState = content;

    contentState = Modifier.mergeBlockData(contentState, firstBlock, blockData);
    contentState = Modifier.applyInlineStyle(contentState, selection, 'COMMENT');

    return EditorState.push(editorState, contentState, 'change-inline-style');
};

/**
 * @description Replaces the comments in the given state and returns the new
 * editor state.
 * @param {EditorState} editorState
 * @param {Map<SelectionState, Comment>} data
 * @returns {EditorState}
 */
export const replaceComments = (editorState, data) => {
    const content = editorState.getCurrentContent();
    const selection = SelectionState.createEmpty(content.getFirstBlock().getKey());
    const contentWithData = Modifier.setBlockData(content, selection, data);
    const newState = EditorState.push(editorState, contentWithData, 'change-block-data');

    return EditorState.acceptSelection(newState, editorState.getSelection());
};
