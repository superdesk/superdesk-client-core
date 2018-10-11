import {RichUtils} from 'draft-js';
import * as entityUtils from '../components/links/entityUtils';

/**
 * @ngdoc method
 * @name createLink
 * @param {Object} editorState
 * @param {Object} link, object with href
 * @return {Object} EditorState
 * @description Create a hyperlink on editorState selection
 */
export function createLink(editorState, link) {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', {link});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const stateAfterChange = RichUtils.toggleLink(
        editorState,
        editorState.getSelection(),
        entityKey,
    );

    return stateAfterChange;
}

/**
 * @ngdoc method
 * @name removeLink
 * @param {Object} editorState
 * @return {Object} EditorState
 * @description Removes the hyperlink on current selection
 */
export function removeLink(editorState) {
    let stateAfterChange = {...editorState};

    entityUtils.getSelectedEntityRange(editorState,
        (start, end) => {
            const selection = editorState.getSelection();
            const entitySelection = selection.merge({
                anchorOffset: start,
                focusOffset: end,
                isBackward: false,
            });

            stateAfterChange = RichUtils.toggleLink(editorState, entitySelection, null);
        },
    );

    return stateAfterChange;
}
