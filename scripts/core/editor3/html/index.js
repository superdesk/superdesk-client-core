import {HTMLGenerator} from './to-html';

/**
 * @name toHTML
 * @param {Object} contentState
 * @description Converts DraftJS ContentState to HTML.
 * @returns {string} HTML
 */
export function toHTML(contentState, logger) {
    return new HTMLGenerator(contentState, logger).html();
}