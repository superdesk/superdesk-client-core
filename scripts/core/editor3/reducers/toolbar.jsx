import {RichUtils, EditorState} from 'draft-js';
import * as entityUtils from '../components/links/entityUtils';
import {onChange} from './editor3';
import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';
import * as Links from '../helpers/links';
import * as Blocks from '../helpers/blocks';
import * as Highlights from '../helpers/highlights';
import {removeFormatFromState} from '../helpers/removeFormat';

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
    case 'TOOLBAR_REMOVE_FORMAT':
        return removeFormat(state);
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

    let stateAfterChange = RichUtils.toggleInlineStyle(
        editorState,
        inlineStyle
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
        if (state.suggestingMode) {
            editorState = highlightEntity(editorState, 'CHANGE_LINK_SUGGESTION',
                {to: link, from: entity.getData().link});
            return onChange(state, editorState);
        } else {
            return onChange(state, entityUtils.replaceSelectedEntityData(editorState, {link}), true);
        }
    }

    editorState = Links.createLink(editorState, link);
    return onChange(state, editorState);
};

/**
 * Highlight current entity
 *
 * @param {EditorState} initialState
 * @param {String} type
 * @param {Object} data
 * @param {Boolean} single
 * @returns {EditorState}
 */
function highlightEntity(initialState, type, data, single) {
    let editorState = initialState;
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selection.getStartKey());
    const entity = block.getEntityAt(selection.getStartOffset());

    block.findEntityRanges((characterMeta) => characterMeta.getEntity() === entity,
        (start, end) => {
            editorState = EditorState.acceptSelection(editorState, selection.merge({
                isBackward: false,
                anchorOffset: start,
                focusOffset: end,
            }));
            editorState = Highlights.addHighlight(editorState, type, data, single);
            editorState = EditorState.push(editorState, editorState.getCurrentContent(), 'apply-entity');
            editorState = EditorState.acceptSelection(editorState, selection);
        });
    return editorState;
}

/**
 * @ngdoc method
 * @name removeLink
 * @description Removes the link on the entire entity under the cursor.
 */
const removeLink = (state) => {
    let {editorState} = state;

    if (state.suggestingMode) {
        editorState = highlightEntity(editorState, 'REMOVE_LINK_SUGGESTION', null, true);
    } else {
        editorState = Links.removeLink(editorState);
    }

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
    const stateWithoutFormat = removeFormatFromState(editorState);

    return onChange(state, stateWithoutFormat);
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
    const newEditorState = Blocks.removeBlock(editorState, blockKey);

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
        invisibles: !invisibles,
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
