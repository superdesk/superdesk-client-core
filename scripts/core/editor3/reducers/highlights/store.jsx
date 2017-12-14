// TODO(gbbr): Perhaps we can store these in the EntityMap once 0.11 is out?
// It seems that the first block key and data never change as far as it has
// been tested. As long as that remains true, storing highlights in the metadata
// of the first block is safe.

import {SelectionState, Modifier, EditorState} from 'draft-js';
import {Map} from 'immutable';

/**
 * @typedef Highlights
 * @property {string} author Author name.
 * @property {string} email Author email.
 * @property {string} date Date.
 * @property {string} msg Text body.
 */

/**
 * @description Returns all the highlights in the given content.
 * @param {ContentState} content
 * @returns {Map<SelectionState, Highlight>}
 */
export const getHighlights = (content, includeResolved = true) => {
    let data = content.getFirstBlock().getData();

    if (!includeResolved) {
        data = data.filter(({resolved}) => !resolved);
    }

    return data;
};

/**
 * @description Adds a new highlight to the editor state for the given selection
 * and data. It returns a new editor state with the changes applied.
 * @param {EditorState} editorState
 * @param {SelectionState} selection
 * @param {Highlight} data
 * @returns {EditorState}
 */
export const addHighlight = (editorState, selection, data) => {
    const content = editorState.getCurrentContent();
    const firstBlock = SelectionState.createEmpty(content.getFirstBlock().getKey());
    const blockData = Map().set(JSON.stringify(selection.toJSON()), data);

    let contentState = content;

    contentState = Modifier.mergeBlockData(contentState, firstBlock, blockData);
    contentState = Modifier.applyInlineStyle(contentState, selection, data.type);

    return EditorState.push(editorState, contentState, 'change-inline-style');
};

/**
 * @description updateHighlight attempts to find the highlight in the passed selection
 * and update it with the given data
 * @param {EditorState} editorState
 * @param {Highlight} highlight 'selection' to update and 'data' to update with.
 * @returns {EditorState}
 */
export const updateHighlight = (editorState, {selection, data}) => {
    const map = getHighlights(editorState.getCurrentContent());
    const key = JSON.stringify(selection.toJSON());

    return replaceHighlights(editorState, map.set(key, data));
};

/**
 * @description Removes the given highlight.
 * @param {EditorState} editorState
 * @param {Object} highlight
 * @returns {EditorState} New editor state with highlight removed.
 */
export const removeHighlight = (editorState, {selection}) => {
    const all = getHighlights(editorState.getCurrentContent());
    const toRemove = JSON.stringify(selection.toJSON());

    return replaceHighlights(editorState, all.remove(toRemove));
};

/**
 * @description Replaces the highlights in the given state and returns the new
 * editor state.
 * @param {EditorState} editorState
 * @param {Map<SelectionState, Highlight>} data
 * @returns {EditorState}
 */
export const replaceHighlights = (editorState, data) => {
    const content = editorState.getCurrentContent();
    const selection = SelectionState.createEmpty(content.getFirstBlock().getKey());
    const contentWithData = Modifier.setBlockData(content, selection, data);
    const newState = EditorState.push(editorState, contentWithData, 'change-block-data');

    return EditorState.acceptSelection(newState, editorState.getSelection());
};
