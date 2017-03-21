import {HTMLGenerator} from './to-html';

/**
 * @name toHTML
 * @param {Object} contentState
 * @description Converts DraftJS ContentState to HTML.
 */
export function toHTML(contentState) {
    return new HTMLGenerator(contentState).html();
}

/**
 * @name fromHTML
 * @param {String} html
 * @description Converts DraftJS ContentState to HTML.
 */
export function fromHTML(html) {
    throw 'Not implemented';
}
