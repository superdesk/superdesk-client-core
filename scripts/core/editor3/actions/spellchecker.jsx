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
