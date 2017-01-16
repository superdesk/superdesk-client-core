import ng from 'core/services/ng';

/**
 * @ngdoc method
 * @name replaceWord
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
 * @name replaceWord
 * @param {String} word
 * @return {String} action
 * @description Creates the add word action
 */
export function addWord(word) {
    const spellcheck = ng.get('spellcheck');

    spellcheck.addWord(word, false);

    return replaceWord(word);
}

/**
 * @ngdoc method
 * @name replaceWord
 * @param {String} word
 * @return {String} action
 * @description Creates the ignore word action
 */
export function ignoreWord(word) {
    const spellcheck = ng.get('spellcheck');

    spellcheck.addWord(word, true);

    return replaceWord(word);
}

/**
 * @ngdoc method
 * @name showContextMenu
 * @param {Object} data
 * @return {String} action
 * @description Creates the close context menu action.
 */
export function closeContextMenu() {
    return {type: 'SPELLCHECKER_CLOSE_CONTEXT_MENU'};
}

/**
 * @ngdoc method
 * @name showContextMenu
 * @param {Object} data
 * @return {String} action
 * @description Creates the show context menu action
 */
export function showContextMenu({word, position}) {
    const spellcheck = ng.get('spellcheck');

    return (dispatch) => {
        spellcheck.suggest(word.text).then((suggestions) =>
            dispatch({
                type: 'SPELLCHECKER_SHOW_CONTEXT_MENU',
                payload: {suggestions, word, position}
            })
        );
    };
}
