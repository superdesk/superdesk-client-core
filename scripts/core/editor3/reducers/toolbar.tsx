import {RichUtils, EditorState} from 'draft-js';
import * as entityUtils from '../components/links/entityUtils';
import {onChange} from './editor3';
import * as Links from '../helpers/links';
import * as Blocks from '../helpers/blocks';
import * as Highlights from '../helpers/highlights';
import {removeFormatFromState} from '../helpers/removeFormat';
import {insertEntity} from '../helpers/draftInsertEntity';
import {IEditorStore} from '../store';
import {PopupTypes} from '../actions/popups';

/**
 * @description Contains the list of toolbar related reducers.
 */
const toolbar = (state: IEditorStore, action) => {
    switch (action.type) {
    case 'TOOLBAR_TOGGLE_BLOCK_STYLE':
        return toggleBlockStyle(state, action.payload);
    case 'TOOLBAR_TOGGLE_INLINE_STYLE':
        return toggleInlineStyle(state, action.payload);
    case 'TOOLBAR_APPLY_LINK':
        return applyLink(state, action.payload);
    case 'TOOLBAR_REMOVE_LINK':
        return removeLink(state);
    case 'TOOLBAR_REMOVE_FORMAT':
        return removeFormat(state);
    case 'TOOLBAR_INSERT_MEDIA':
        return insertMedia(state, action.payload);
    case 'TOOLBAR_UPDATE_IMAGE':
        return updateImage(state, action.payload);
    case 'TOOLBAR_REMOVE_BLOCK':
        return removeBlock(state, action.payload);
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
        blockType,
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

    let stateAfterChange = RichUtils.toggleInlineStyle(
        editorState,
        inlineStyle,
    );

    // Check if there was a suggestions to toggle that style
    stateAfterChange = handleExistingInlineStyleSuggestionOnToggle(stateAfterChange, inlineStyle);

    return onChange(state, stateAfterChange);
};

const handleExistingInlineStyleSuggestionOnToggle = (editorState, inlineStyle) => {
    const type = Highlights.getTypeByInlineStyle(inlineStyle);
    const highlightName = Highlights.getHighlightStyleAtCurrentPosition(editorState, type);

    if (highlightName) {
        return Highlights.removeHighlight(editorState, highlightName);
    }

    return editorState;
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
    let {editorState} = state;

    if (entity) {
        return onChange(state, entityUtils.replaceSelectedEntityData(editorState, {link}), true);
    }

    editorState = Links.createLink(editorState, link);
    return onChange(state, editorState);
};

/**
 * @ngdoc method
 * @name removeLink
 * @description Removes the link on the entire entity under the cursor.
 */
const removeLink = (state) => {
    let {editorState} = state;

    editorState = Links.removeLink(editorState);
    return onChange(state, editorState);
};

/*
 * @ngdoc method
 * @name removeFormat
 * @description Set all blocks in selection to unstyled except atomic blocks
 *              and remove inline styles
 */
const removeFormat = (state) => {
    const {editorState} = state;
    const selection = editorState.getSelection();
    const stateWithoutFormat = removeFormatFromState(editorState);
    const newSelection = selection.merge({
        anchorOffset: selection.getEndOffset(),
        anchorKey: selection.getEndKey(),
        focusOffset: selection.getEndOffset(),
        focusKey: selection.getEndKey(),
        isBackward: false,
        hasFocus: true,
    });

    return onChange(state, EditorState.acceptSelection(stateWithoutFormat, newSelection));
};

/**
 * @ngdoc method
 * @name insertMedia
 * @param {Array} files List of media files to be inserted into document.
 * @param {String} targetBlockKey Block key where we want to insert the media
 * @description Inserts a list of media files into the document.
 */
const insertMedia = (state, {files = [], targetBlockKey = null}) => {
    let {editorState} = state;

    files.forEach((file) => {
        editorState = addMedia(editorState, file, targetBlockKey);
    });

    return onChange(state, editorState);
};

/**
 * @ngdoc method
 * @name addMedia
 * @param {Object} editorState Editor state to add the media to.
 * @param {Object} media Media data.
 * @param {String} targetBlockKey Block key where the media is going to
 * @returns {Object} New editor state with media inserted as atomic block.
 * @description Inserts the given media into the given editor state's content and returns
 * the updated editor state.
 */
export const addMedia = (editorState: EditorState, media, targetBlockKey = null): EditorState =>
    insertEntity(editorState, 'MEDIA', 'MUTABLE', {media}, targetBlockKey);

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
    const newEditorState = Blocks.removeBlock(editorState, blockKey);

    return onChange(state, newEditorState);
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
        invisibles: !invisibles,
    };
};

/**
 * @ngdoc method
 * @name setPopup
 * @param {Object} data Type of popup and popup data.
 * @description Sets the toolbar popup to the given type.
 */
const setPopup = (state: IEditorStore, {type, data}) => {
    const {editorState} = state;
    let newEditorState = editorState;

    // SDESK-3885
    // Whenever we hide a popup, the ContentState is not changed so it will
    // trigger these two DraftJS events:
    //     * editOnFocus
    //     * editOnSelect
    // The first one renders the right selection but the second one uses
    // global `window.getSelection()` (which doesn't exist, as the editor lost focus)
    // to check if the editorState selection matches that one. As it doesn't, it renders
    // the selection in the first character of the first block.
    // Using `forceSelection` won't trigger those events and the selection will be correct.
    if (type === PopupTypes.Hidden) {
        newEditorState = EditorState.forceSelection(editorState, editorState.getSelection());
    }

    return {...state, editorState: newEditorState, popup: {type, data}};
};

export default toolbar;
