import ng from 'core/services/ng';
import {insertMedia} from './toolbar';
import {logger} from 'core/services/logger';
import {SelectionState, convertFromRaw, EditorState} from 'draft-js';
import {IArticle} from 'superdesk-api';
import {getFieldMetadata, fieldsMetaKeys} from '../helpers/fieldsMeta';

/**
 * @ngdoc method
 * @name changeEditorState
 * @param {Object} editorState
 * @param {force} force update
 * @return {String} action
 * @description Creates the change editor action
 */
export function changeEditorState(editorState, force = false, skipOnChange = false) {
    return {
        type: 'EDITOR_CHANGE_STATE',
        payload: {editorState, force, skipOnChange},
    };
}

/**
 * @ngdoc method
 * @name forceUpdate
 * @return {String} action
 * @description Causes the editor to force update. This is used by the spellchecker
 * to cause the editor to re-render its decorators based on new information retrieved
 * in dictionaries. Use of this method should be avoided.
 */
export function forceUpdate() {
    return {type: 'EDITOR_FORCE_UPDATE'};
}

/**
 * @ngdoc method
 * @name setAbbreviations
 * @return {Object} abbreviations
 * @description set the abbreviation dictionary
 */
export function setAbbreviations(abbreviations) {
    return {
        type: 'EDITOR_SET_ABBREVIATIONS',
        payload: abbreviations,
    };
}

/**
 * @ngdoc method
 * @name handleEditorTab
 * @param {Object} e on tab event
 * @return {String} action
 * @description Creates the change editor action
 */
export function handleEditorTab(e) {
    return {
        type: 'EDITOR_TAB',
        payload: e,
    };
}

/**
 * @ngdoc method
 * @name dragDrop
 * @param {DataTransfer} transfer
 * @return {String} mediaType
 * @return {String} blockKey
 * @description Creates the editor drop action.
 */
export function dragDrop(transfer, mediaType, blockKey = null) {
    if (mediaType === 'Files') {
        return insertMedia(transfer.files);
    }

    return (dispatch) => {
        const content = ng.get('content');

        dispatch({type: 'EDITOR_LOADING', payload: true});

        const item: IArticle = JSON.parse(transfer.getData(mediaType));

        return content.dropItem(item, {fetchExternal: true})
            .then((data) => {
                dispatch({
                    type: 'EDITOR_DRAG_DROP',
                    payload: {data, blockKey},
                });
            })
            .finally(() => {
                dispatch({type: 'EDITOR_LOADING', payload: false});
            });
    };
}

/**
 * @ngdoc method
 * @name setLocked
 * @param {Event} v
 * @return {String} action
 * @description Dispatches the action to set the main editor as locked. The main editor
 * is locked when other atomic blocks are edited that manage their own editor, such
 * as tables or image descriptions.
 */
export function setLocked(v) {
    return {
        type: 'EDITOR_SET_LOCKED',
        payload: v,
    };
}

/**
 * @ngdoc method
 * @name setReadOnly
 * @param {Event} v
 * @return {String} action
 * @description Dispatches the action to set the main editor as read-only. This is
 * mainly used externally to allow bi-directional binding of the readOnly attribute
 * on the Angular directive. Not used in React.
 */
export function setReadOnly(v) {
    return {
        type: 'EDITOR_SET_READONLY',
        payload: v,
    };
}

/**
 * @ngdoc method
 * @name setActiveCell
 * @description Sets the active table and cell inside the editor.
 */
export function setActiveCell(i, j, key, currentStyle, selection) {
    return {
        type: 'EDITOR_SET_CELL',
        payload: {i, j, key, currentStyle, selection},
    };
}

/**
 * @ngdoc method
 * @name changeImageCaption
 * @param {string} entityKey
 * @param {string} newCaption
 * @param {string} field (headline or description)
 * @description Change the image caption contained in the given entity key.
 * @returns {Object}
 */
export function changeImageCaption(entityKey, newCaption, field: 'headline' | 'description_text') {
    return {
        type: 'EDITOR_CHANGE_IMAGE_CAPTION',
        payload: {entityKey, newCaption, field},
    };
}

export function mergeEntityDataByKey(blockKey, entityKey, valuesToMerge) {
    return {
        type: 'MERGE_ENTITY_DATA_BY_KEY',
        payload: {blockKey, entityKey, valuesToMerge},
    };
}

/**
 * @ngdoc method
 * @name setHtmlFromTansa
 * @param {string} html
 * @param {string} simpleReplace
 * @description For every block from editor content merge the changes received from Tansa.
 * If simpleReplace is true on merge will not try to preserve inline style and entity
 * @returns {Object}
 */
export function setHtmlFromTansa(html, simpleReplace) {
    return {
        type: 'EDITOR_SET_HTML_FROM_TANSA',
        payload: {html, simpleReplace},
    };
}

export const setEditorStateFromItem = (item: IArticle, field: string) => {
    const rawState = getFieldMetadata(item, field, fieldsMetaKeys.draftjsState);
    const contentState = convertFromRaw(rawState);

    return {
        type: 'EDITOR_PUSH_STATE',
        payload: {contentState},
    };
};

/**
 * Move one block after another
 *
 * @param {String} block
 * @param {String} dest
 * @return {Object}
 */
export function moveBlock(block, dest, insertionMode) {
    return {
        type: 'EDITOR_MOVE_BLOCK',
        payload: {block, dest, insertionMode},
    };
}

export function processEmbedCode(data) {
    if (typeof data !== 'string' &&
        (typeof data !== 'object' && typeof data.html !== 'string')
    ) {
        logger.error(new Error('embed format not recognized'));
    }
    return data;
}

/**
 * @ngdoc method
 * @name embed
 * @param {Object|string} oEmbed code, HTML string.
 * @return {Object}
 * @description Dispatches the action to use the given oEmbed data for media embedding.
 */
export function embed(code, targetBlockKey = null) {
    return {
        type: 'EDITOR_APPLY_EMBED',
        payload: {
            code: processEmbedCode(code),
            targetBlockKey,
        },
    };
}

export type ITextCase = 'uppercase' | 'lowercase';
export function changeCase(changeTo: ITextCase, selection: SelectionState) {
    return {
        type: 'CHANGE_CASE',
        payload: {changeTo, selection},
    };
}
