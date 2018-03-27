import {HTMLGenerator} from './to-html';
import {HTMLParser} from './from-html';

/**
 * @name toHTML
 * @param {Object} contentState
 * @description Converts DraftJS ContentState to HTML.
 * @returns {string} HTML
 */
export function toHTML(contentState, logger) {
    return new HTMLGenerator(contentState, logger).html();
}

/**
 * @name fromHTML
 * @param {String} html
 * @description Converts DraftJS ContentState to HTML.
 * @returns {ContentState} DraftJS ContentState
 */
export function fromHTML(html) {
    return new HTMLParser(html).contentState();
}
