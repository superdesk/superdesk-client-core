import {RichUtils, EditorState, AtomicBlockUtils, SelectionState} from 'draft-js';
import {setTansaHtml} from '../helpers/tansa';
import {addMedia} from './toolbar';
import {isEditorPlainText} from '../store';
import {replaceWord} from './spellchecker';
import {DELETE_SUGGESTION} from '../highlightsConfig';
import {moveBlockWithoutDispatching} from '../helpers/draftMoveBlockWithoutDispatching';
import {insertEntity} from '../helpers/draftInsertEntity';

/**
 * @description Contains the list of editor related reducers.
 */
const editor3 = (state = {}, action) => {
    switch (action.type) {
    case 'EDITOR_CHANGE_STATE':
        return onChange(state, action.payload.editorState, action.payload.force, false, action.payload.skipOnChange);
    case 'EDITOR_SET_LOCKED':
        return setLocked(state, action.payload);
    case 'EDITOR_SET_READONLY':
        return setReadOnly(state, action.payload);
    case 'EDITOR_TAB':
        return onTab(state, action.payload);
    case 'EDITOR_FORCE_UPDATE':
        return forceUpdate(state);
    case 'EDITOR_SET_ABBREVIATIONS':
        return setAbbreviations(state, action.payload);
    case 'EDITOR_DRAG_DROP':
        return dragDrop(state, action.payload);
    case 'EDITOR_SET_CELL':
        return setCell(state, action.payload);
    case 'MERGE_ENTITY_DATA_BY_KEY':
        return mergeEntityDataByKey(state, action.payload);
    case 'EDITOR_CHANGE_IMAGE_CAPTION':
        return changeImageCaption(state, action.payload);
    case 'EDITOR_SET_HTML_FROM_TANSA':
        return setHtmlFromTansa(state, action.payload);
    case 'EDITOR_MOVE_BLOCK':
        return moveBlock(state, action.payload);
    case 'EDITOR_APPLY_EMBED':
        return applyEmbed(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name forceUpdate
 * @param {Object} editorState
 * @param {Bool} keepSelection if set to true it won't force selection
 * @return {Object}
 * @description Forces an update of the editor. This is somewhat of a hack
 * based on https://github.com/facebook/draft-js/issues/458#issuecomment-225710311
 * until a better solution is found.
 */
export const forceUpdate = (state, keepSelection = false) => {
    const {editorState, spellcheckerEnabled} = state;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const decorator = editorState.getDecorator(!spellcheckerEnabled);
    let newState = EditorState.createWithContent(content, decorator);

    newState = EditorState.set(newState, {
        undoStack: editorState.getUndoStack(),
        redoStack: editorState.getRedoStack(),
    });

    if (!keepSelection) {
        newState = EditorState.forceSelection(newState, selection);
    }

    return {
        ...state,
        editorState: newState,
    };
};

/**
 * @ngdoc method
 * @name onChange
 * @param {Object} state
 * @param {Object} editorState
 * @param {Bool} force When true, forces an editor update regardless of whether the content has changed.
 * This is used because currently it is impossible to detect changes happening solely on entity data.
 * In Draft v0.11.0 we will be able to request all entities from the content and could compare them to get a
 * more accurate result.
 * See https://draftjs.org/docs/api-reference-content-state.html#getentitymap"
 * @param {Bool} keepSelection keep selection as it is
 * @return {Object} returns new state
 * @description Handle the editor state has been changed event
 */
export const onChange = (state, newState: EditorState, force = false, keepSelection = false, skipOnChange = false) => {
    // TODO(x): Remove `force` once Draft v0.11.0 is in
    const editorState = newState;

    const contentChanged = state.editorState.getCurrentContent() !== newState.getCurrentContent();

    if (!skipOnChange && (contentChanged || force)) {
        const plainText = isEditorPlainText(state);

        state.onChangeValue(editorState.getCurrentContent(), {plainText});
    }

    if (force) {
        return forceUpdate(
            applyAbbreviations({
                ...state,
                editorState,
            }),
            keepSelection,
        );
    }

    return applyAbbreviations({
        ...state,
        editorState,
    });
};

/**
 * @ngdoc method
 * @name setAbbreviations
 * @param {Object} state
 * @param {Object} abbreviations
 * @return {Object} returns new state
 * @description Set the abbreviations dictionary
 */
const setAbbreviations = (state, abbreviations) => ({
    ...state,
    abbreviations,
});

/**
 * @ngdoc method
 * @name applyAbbreviations
 * @param {Object} editorState
 * @param {Array} abbreviations
 * @return {Object} returns new state
 * @description Handle the editor tab key pressed event
 */
const applyAbbreviations = (state) => {
    const {editorState, abbreviations} = state;
    const selection = editorState.getSelection();

    if (!selection.isCollapsed() || abbreviations == null || Object.keys(abbreviations).length === 0) {
        return state;
    }

    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(selection.getStartKey());
    const word = getAbbreviationText(block, selection.getStartOffset());

    if (word == null) {
        return state;
    }

    const keys = Object.keys(abbreviations);
    const pattern = '\\b(' + keys.map((item) => escapeRegExp(item)).join('|') + ')(\\*)';
    const found = word.text.match(new RegExp(pattern, 'g'));

    if (found) {
        const abbreviation = found[0].replace('*', '');
        const newWord = abbreviations[abbreviation];

        return replaceWord(state, {word, newWord}, true);
    }

    return state;
};

/**
 * @ngdoc method
 * @name getAbbreviationText
 * @param {Object} block
 * @param {Integer} offset
 * @return {String} returns text that can contain abbreviation
 * @description From current position extract text that is
 * delimited on both sides by space, round brackets or delete suggestion
 */
const getAbbreviationText = (block, offset) => {
    const text = block.getText();
    const length = block.getLength();
    let start = offset;
    let end = offset;

    if (!text.includes('*')) {
        return null;
    }

    while (start > 0 && text[start - 1] !== ' ' && text[start - 1] !== '(' && text[start - 1] !== ')') {
        const inlineStyles = block.getInlineStyleAt(start - 1);

        if (inlineStyles.some((style) => style.startsWith(DELETE_SUGGESTION))) {
            break;
        }

        start--;
    }

    while (end < length && text[end] !== ' ' && text[end] !== '(' && text[end] !== ')') {
        const inlineStyles = block.getInlineStyleAt(end);

        if (inlineStyles.some((style) => style.startsWith(DELETE_SUGGESTION))) {
            break;
        }

        end++;
    }

    const textWithAbbreviation = text.substring(start, end);

    if (!textWithAbbreviation.includes('*')) {
        return null;
    }

    return {text: textWithAbbreviation, offset: start};
};

/**
 * Escape given string for reg exp
 *
 * @url https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
 *
 * @param {string} string
 * @return {string}
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @ngdoc method
 * @name onTab
 * @param {Object} event
 * @return {Object} returns new state
 * @description Handle the editor tab key pressed event
 */
const onTab = (state, e) => {
    const {editorState} = state;
    const newState = RichUtils.onTab(e, editorState, 4);

    return onChange(state, newState);
};

/**
 * @ngdoc method
 * @name dragDrop
 * @param {String} data event data
 * @return {Object} New state
 * @description Handles the dragdrop event over the editor.
 */
const dragDrop = (state, {data, blockKey}) => {
    const media = JSON.parse(data);
    const editorState = addMedia(state.editorState, media, blockKey);

    return {
        ...onChange(state, editorState),

        // Exit table edit mode.
        // It usually exits when the main editor is focused
        // but in case of drag and drop, the main editor is not getting focused.
        // Ideally, the table component would exit editmode itself onBlur,
        // but I wasn't able to implement it.
        activeCell: null,
    };
};

/**
 * @ngdoc method
 * @name setLocked
 * @param {Boolean=} locked If true, editor is locked (read-only).
 * @return {Object} New state
 * @description Handles setting the editor as active, or read-only.
 */
const setLocked = (state, locked = true) => {
    let {activeCell} = state;

    if (!locked) {
        activeCell = null;
    }

    return {...state, locked, activeCell};
};

/**
 * @ngdoc method
 * @name setReadOnly
 * @param {Boolean=} locked If true, editor is set to read-only.
 * @return {Object} New state
 * @description Handles setting the editor as active, or read-only.
 */
const setReadOnly = (state, readOnly) => ({
    ...state,
    readOnly: readOnly,
    activeCell: null,
});

/**
 * @ngdoc method
 * @name setCell
 * @param {Object} ijK Contains active block key, row (i) and col (j).
 * @return {Object} New state
 * @description Sets the currently being edited (active) table cell.
 */
const setCell = (state, {i, j, key, currentStyle, selection}) => ({
    ...state,
    locked: true,
    activeCell: {i, j, key, currentStyle, selection},
});

const mergeEntityDataByKey = (state, {blockKey, entityKey, valuesToMerge}) => {
    const {editorState} = state;
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const entityDataHasChanged = true;
    const newContentState = contentState.mergeEntityData(entityKey, valuesToMerge);
    const newBlockKey = newContentState.getKeyAfter(blockKey) || blockKey;
    const newBlock = newContentState.getBlockBefore(blockKey);
    const newSelection = selection.merge({
        anchorOffset: newBlock != null ? newBlock.getLength() : null,
        anchorKey: newBlock != null ? newBlock.getKey() : newBlockKey,
        focusOffset: newBlock != null ? newBlock.getLength() : null,
        focusKey: newBlock != null ? newBlock.getKey() : newBlockKey,
        isBackward: false,
        hasFocus: true,
    });

    let newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');

    newEditorState = EditorState.forceSelection(newEditorState, newSelection);
    return onChange(state, newEditorState, entityDataHasChanged, true);
};

/**
 * @ngdoc method
 * @name setCell
 * @param {string} entityKey
 * @param {string} changeImageCaption
 * @return {Object} New state
 * @description Sets a new caption for the image at entityKey.
 */
const changeImageCaption = (state, {entityKey, newCaption, field}) => {
    const {editorState} = state;
    const contentState = editorState.getCurrentContent();
    const entity = contentState.getEntity(entityKey);
    const {media} = entity.getData();

    if (field === 'Title') {
        media.headline = newCaption;
    } else {
        media.description_text = newCaption;
    }

    const newContentState = contentState.replaceEntityData(entityKey, {media});
    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
    const entityDataHasChanged = true;

    return onChange(state, newEditorState, entityDataHasChanged, true);
};

/**
 * @ngdoc method
 * @name setHtmlForTansa
 * @param {string} html
 * @param {string} simpleReplace
 * @description Replaces the current editor content with the given HTML. This is used
 * by the Tansa spellchecker to apply a corrected text.
 * If the simpleReplace is true try to preserve the existing inline styles and entities
 * @returns {Object}
 */
const setHtmlFromTansa = (state, {html, simpleReplace}) => {
    const {editorState} = state;
    const newEditorState = setTansaHtml(editorState, html, simpleReplace);

    return onChange(state, newEditorState);
};

/**
 * Move atomic block
 *
 * @param {Object} state
 * @param {Object} options
 *                 block
 *                 dest
 *                 insertionMode before|after
 * @return {Object}
 */
export function moveBlock(state, options) {
    const stateWithMovedBlock = moveBlockWithoutDispatching(state, options);

    return onChange(state, stateWithMovedBlock.editorState);
}

/**
 * @ngdoc method
 * @name applyEmbed
 * @param {Object|string} data oEmbed data, HTML string.
 * @description Applies the embed in the given oEmbed data to the active block.
 */
const applyEmbed = (state, {code, targetBlockKey}) => {
    const data = typeof code === 'string' ? {html: code} : code;
    const nextEditorState = insertEntity(state.editorState, 'EMBED', 'MUTABLE', {data}, targetBlockKey);

    return onChange(state, nextEditorState);
};

export default editor3;
