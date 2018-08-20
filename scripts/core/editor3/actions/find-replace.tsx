/**
 * @ngdoc method
 * @name findNext
 * @param {String} txt Text to find
 * @description Creates the action to find the next occurence of txt.
 */
export function findNext() {
    return {type: 'HIGHLIGHTS_FIND_NEXT'};
}

/**
 * @ngdoc method
 * @name findPrev
 * @param {String} txt Text to find
 * @description Creates the action to find the previous occurence of txt.
 */
export function findPrev() {
    return {type: 'HIGHLIGHTS_FIND_PREV'};
}

/**
 * @ngdoc method
 * @name replace
 * @param {String} from Text to replace from
 * @param {String} to Text to replace to
 * @description Creates the action to replace the current highlight from from to to.
 */
export function replace(withTxt) {
    return {
        type: 'HIGHLIGHTS_REPLACE',
        payload: withTxt,
    };
}

/**
 * @ngdoc method
 * @name replaceAll
 * @param {String} from Text to replace from
 * @param {String} to Text to replace to
 * @description Creates the action to replace all occurences of from to to.
 */
export function replaceAll(withTxt) {
    return {
        type: 'HIGHLIGHTS_REPLACE_ALL',
        payload: withTxt,
    };
}

/**
 * @ngdoc method
 * @name renderHighlights
 * @description Creates the action to re-render all the highlights.
 */
export function renderHighlights() {
    return {type: 'HIGHLIGHTS_RENDER'};
}

/**
 * @ngdoc method
 * @name setSearchSettings
 * @description Creates the action to set new search settings
 */
export function setHighlightCriteria(opts) {
    return {
        type: 'HIGHLIGHTS_CRITERIA',
        payload: opts,
    };
}
