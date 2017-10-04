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
 * @param {Object} link Link data to apply
 * @param {Entity|null} entity The entity to apply the URL too.
 * @description Applies the given URL to the current content selection. If an
 * entity is specified, it applies the link to that entity instead.
 */
const applyLink = (state, {link, entity}) => {
    const {editorState} = state;

    if (entity) {
        return {...state, editorState: entityUtils.replaceSelectedEntityData(editorState, {link})};
    }

    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', {link});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
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
                focusOffset: end,
                isBackward: false
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

    state.onChangeValue(editorState.getCurrentContent());

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
    const selection = editorState.getSelection();
    const newState = EditorState.forceSelection(editorState, selection);

    state.onChangeValue(newState.getCurrentContent());

    return {...state, editorState: newState};
};

/**
 * @ngdoc method
 * @name applyEmbed
 * @param {Object|string} data oEmbed data, HTML string or Qumu widget config.
 * @description Applies the embed in the given oEmbed data to the active block.
 */
const applyEmbed = (state, code) => {
    var {editorState} = state;

    const contentState = state.editorState.getCurrentContent();
    const data = typeof code === 'string' ? {html: code} : code;
    const contentStateWithEntity = contentState.createEntity('EMBED', 'MUTABLE', {data});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    editorState = AtomicBlockUtils.insertAtomicBlock(
        editorState,
        entityKey,
        ' '
    );

    return {...state, editorState};
};

export default toolbar;
