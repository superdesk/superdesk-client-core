import {RichUtils, Entity} from 'draft-js';
import * as common from '../common';

/**
 * @description Contains the list of toolbar related reducers.
 */
const toolbar = (state = {}, action) => {
    switch (action.type) {
    case 'TOOLBAR_TOGGLE_BLOCK_STYLE':
        return toggleBlockStyle(state, action.payload);
    case 'TOOLBAR_TOGGLE_INLINE_STYLE':
        return toggleInlineStyle(state, action.payload);
    case 'TOOLBAR_APPLY_LINK':
        return applyLink(state, action.payload);
    case 'TOOLBAR_REMOVE_LINK':
        return removeLink(state);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name toggleBlockStyle
 * @param {string} blockStyle
 * @description Applies the given block style.
 */
const toggleBlockStyle = (state, blockType) => {
    const {editorState} = state;
    const stateAfterChange = RichUtils.toggleBlockType(
        editorState,
        blockType
    );

    return {...state, editorState: stateAfterChange};
};

/**
 * @ngdoc method
 * @name toggleInlineStyle
 * @param {string} inlineStyle
 * @description Applies the given inline style.
 */
const toggleInlineStyle = (state, inlineStyle) => {
    const {editorState} = state;
    const stateAfterChange = RichUtils.toggleInlineStyle(
        editorState,
        inlineStyle
    );

    return {...state, editorState: stateAfterChange};
};

/**
 * @ngdoc method
 * @name applyLink
 * @param {string} url The URL to apply
 * @param {Entity|null} entity The entity to apply the URL too.
 * @description Applies the given URL to the current content selection. If an
 * entity is specified, it applies the link to that entity instead.
 */
const applyLink = (state, {url, entity}) => {
    const {editorState} = state;

    if (entity) {
        const key = common.getSelectedEntityKey(editorState);

        Entity.mergeData(key, {url});

        return {...state};
    }

    const entityKey = Entity.create('LINK', 'MUTABLE', {url});
    const stateAfterChange = RichUtils.toggleLink(
        editorState,
        editorState.getSelection(),
        entityKey
    );

    return {...state, editorState: stateAfterChange};
};

/**
 * @ngdoc method
 * @name removeLink
 * @description Removes the link on the entire entity under the cursor.
 */
const removeLink = (state) => {
    const {editorState} = state;
    var stateAfterChange = editorState;

    common.getSelectedEntityRange(editorState,
        (start, end) => {
            const selection = editorState.getSelection();
            const entitySelection = selection.merge({
                anchorOffset: start,
                focusOffset: end
            });

            stateAfterChange = RichUtils.toggleLink(editorState, entitySelection, null);
        }
    );

    return {...state, editorState: stateAfterChange};
};

export default toolbar;
