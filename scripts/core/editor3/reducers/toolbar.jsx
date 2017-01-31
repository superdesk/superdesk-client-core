import {RichUtils, Entity, AtomicBlockUtils, EditorState} from 'draft-js';
import * as entityUtils from '../components/links/entityUtils';

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
    case 'TOOLBAR_INSERT_IMAGES':
        return insertImages(state, action.payload);
    case 'TOOLBAR_UPDATE_IMAGE':
        return updateImage(state, action.payload);
    case 'TOOLBAR_APPLY_EMBED':
        return applyEmbed(state, action.payload);
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
        const key = entityUtils.getSelectedEntityKey(editorState);

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

    entityUtils.getSelectedEntityRange(editorState,
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

/**
 * @ngdoc method
 * @name insertImages
 * @param {Array} imgs List of images to insert into document.
 * @description Inserts a list of images into the document.
 */
const insertImages = (state, imgs = []) => {
    var {editorState} = state;

    imgs.forEach((img) => {
        editorState = addImage(editorState, img);
    });

    return {...state, editorState};
};

/**
 * @ngdoc method
 * @name addImage
 * @param {Object} editorState Editor state to add the image too.
 * @param {Object} img Image data.
 * @returns {Object} New editor state with image inserted as atomic block.
 * @description Inserts the given image into the given editor state's content and returns
 * the updated editor state.
 */
export const addImage = (editorState, img) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('IMAGE', 'MUTABLE', {img});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    return AtomicBlockUtils.insertAtomicBlock(
        editorState,
        entityKey,
        ' '
    );
};

/**
 * @ngdoc method
 * @name updateImage
 * @param {Object} data Contains the entityKey and the new image data.
 * @description Updates the given entityKey with the new image data.
 */
const updateImage = (state, {entityKey, img}) => {
    Entity.replaceData(entityKey, {img});

    // focus the editor and softly force a refresh
    const {editorState} = state;
    const newState = EditorState.forceSelection(
        editorState,
        editorState.getSelection()
    );

    return {...state, editorState: newState};
};

/**
 * @ngdoc method
 * @name applyEmbed
 * @param {Object} data oEmbed data
 * @description Applies the embed in the given oEmbed data to the active block.
 */
const applyEmbed = (state, data) => {
    var {editorState} = state;

    const entityKey = Entity.create('EMBED', 'MUTABLE', {data});

    editorState = AtomicBlockUtils.insertAtomicBlock(
        editorState,
        entityKey,
        ' '
    );

    return {...state, editorState};
};

export default toolbar;
