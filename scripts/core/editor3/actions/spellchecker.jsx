/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Spellchecker Actions
 * @description Contains the list of spellchecker related actions.
 */

/**
 * @ngdoc method
 * @name Spellchecker Actions#replaceWord
 * @param {String} word
 * @return {String} action
 * @description Creates the replace word action
 */
export function replaceWord(word) {
    return {
        type: 'SPELLCHECKER_REPLACE_WORD',
        payload: word
    };
}

/**
 * @ngdoc method
 * @name Spellchecker Actions#showContextMenu
 * @param {Object} contextMenuData
 * @return {String} action
 * @description Creates the show context menu action
 */
export function showContextMenu(contextMenuData) {
    return {
        type: 'SPELLCHECKER_SHOW_CONTEXT_MENU',
        payload: contextMenuData
    };
}
