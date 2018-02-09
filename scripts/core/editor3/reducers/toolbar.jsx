import {RichUtils, EditorState, SelectionState, Modifier, CompositeDecorator} from 'draft-js';
import ng from 'core/services/ng';
import * as entityUtils from '../components/links/entityUtils';
import {onChange} from './editor3';
import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';
import {LinkDecorator} from '../components/links';
import {SpellcheckerDecorator} from '../components/spellchecker';
import {SpaceDecorator} from '../components/invisibles';

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
    case 'TOOLBAR_INSERT_MEDIA':
        return insertMedia(state, action.payload);
    case 'TOOLBAR_UPDATE_IMAGE':
        return updateImage(state, action.payload);
    case 'TOOLBAR_REMOVE_BLOCK':
        return removeBlock(state, action.payload);
    case 'TOOLBAR_APPLY_EMBED':
        return applyEmbed(state, action.payload);
    case 'TOOLBAR_SET_POPUP':
        return setPopup(state, action.payload);
    case 'TOOLBAR_TOGGLE_INVISIBLES':
        return toggleInvisibles(state);
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

    return onChange(state, stateAfterChange);
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

    return onChange(state, stateAfterChange);
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
        return onChange(state, entityUtils.replaceSelectedEntityData(editorState, {link}), true);
    }

    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', {link});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const stateAfterChange = RichUtils.toggleLink(
        editorState,
        editorState.getSelection(),
        entityKey
    );

    return onChange(state, stateAfterChange);
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

    return onChange(state, stateAfterChange);
};

/**
 * @ngdoc method
 * @name insertMedia
 * @param {Array} files List of media files to be inserted into document.
 * @description Inserts a list of media files into the document.
 */
const insertMedia = (state, files = []) => {
    var {editorState} = state;

    files.forEach((file) => {
        editorState = addMedia(editorState, file);
    });

    return onChange(state, editorState);
};

/**
 * @ngdoc method
 * @name addMedia
 * @param {Object} editorState Editor state to add the media to.
 * @param {Object} media Media data.
 * @returns {Object} New editor state with media inserted as atomic block.
 * @description Inserts the given media into the given editor state's content and returns
 * the updated editor state.
 */
export const addMedia = (editorState, media) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('MEDIA', 'MUTABLE', {media});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    return insertAtomicBlockWithoutEmptyLines(
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
const updateImage = (state, {entityKey, media}) => {
    const {editorState} = state;
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const newContentState = contentState.replaceEntityData(entityKey, {media});
    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
    // focus the editor and softly force a refresh
    const newState = EditorState.forceSelection(newEditorState, selection);
    const entityDataHasChanged = true;

    return onChange(state, newState, entityDataHasChanged);
};

/**
 * @ngdoc method
 * @name removeBlock
 * @param {Object} data Contains the key from of block to remove
 * @description Removes block from editor
 */
const removeBlock = (state, {blockKey}) => {
    const {editorState} = state;
    const contentState = editorState.getCurrentContent();

    const afterKey = contentState.getKeyAfter(blockKey);
    const targetRange = new SelectionState({
        anchorKey: blockKey,
        anchorOffset: 0,
        focusKey: afterKey,
        focusOffset: 0
    });
    let newContentState = Modifier.setBlockType(
        contentState,
        targetRange,
        'unstyled'
    );

    newContentState = Modifier.removeRange(newContentState, targetRange, 'backward');
    const newEditorState = EditorState.push(editorState, newContentState, 'remove-range');

    return onChange(state, newEditorState);
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

    editorState = insertAtomicBlockWithoutEmptyLines(
        editorState,
        entityKey,
        ' '
    );

    return onChange(state, editorState);
};


/**
 * @ngdoc method
 * @name toggleInvisibles
 * @param {Object} state
 * @return {Object} returns new state
 * @description Enable/Disable the paragraph marks
 */
const toggleInvisibles = (state) => {
    const {invisibles} = state;

    return {
        ...state,
        invisibles: !invisibles
    };
};

/**
 * @ngdoc method
 * @name setPopup
 * @param {Object} data Type of popup and popup data.
 * @description Sets the toolbar popup to the given type.
 */
const setPopup = (state, {type, data}) => ({...state, popup: {type, data}});

export default toolbar;
