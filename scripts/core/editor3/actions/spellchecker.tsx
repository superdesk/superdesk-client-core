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
        payload: word,
    };
}

/**
 * @ngdoc method
 * @name refreshWord
 * @param {String} word
 * @return {String} action
 * @description Refreshes the passed word (usually after having being added
 * to the dictionary).
 */
export function refreshWord(word) {
    return {
        type: 'SPELLCHECKER_REFRESH_WORD',
        payload: word,
    };
}

/**
 * @ngdoc method
 * @name setAutoSpellchecker
 * @param {Boolean} enabled True if the autospellchecker should be enabled
 * @return {String} action
 * @description Enable/disable auto mode for spellchecker.
 */
export function setAutoSpellchecker(enabled) {
    return {
        type: 'SPELLCHECKER_AUTO',
        payload: enabled,
    };
}
