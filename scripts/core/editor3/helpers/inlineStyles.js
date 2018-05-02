import {SelectionState, Modifier} from 'draft-js';

/**
 * @type {Object}
 * @description Maps server 'editorFormat' options to Draft inline styles.
 */
export const inlineStyles = {
    bold: 'BOLD',
    italic: 'ITALIC',
    underline: 'UNDERLINE',
    subscript: 'SUBSCRIPT',
    superscript: 'SUPERSCRIPT',
    strikethrough: 'STRIKETHROUGH',
};

export const acceptedInlineStyles = Object.values(inlineStyles);

/**
 * Sanitize given content state on paste
 *
 * @param {ContentState} content
 * @param {Array} acceptedInlineStyles
 * @returns {ContentState}
 */
export function sanitizeContent(content, acceptedInlineStyles = acceptedInlineStyles) {
    let output = content;

    const ignoreStyle = (style) => acceptedInlineStyles.indexOf(style) === -1;
    const getSelection = (block, start, end) => SelectionState.createEmpty(block.getKey()).merge({
        anchorOffset: start,
        focusOffset: end,
    });

    content.getBlockMap().forEach((block) => {
        // remove extra styles
        block.findStyleRanges(
            (character) => character.getStyle().some(ignoreStyle),
            (start, end) => {
                const selection = getSelection(block, start, end);
                const inlineStyle = block.getInlineStyleAt(start).find(ignoreStyle);

                output = Modifier.removeInlineStyle(output, selection, inlineStyle);
            }
        );

        // remove any entities
        block.findEntityRanges(
            () => true,
            (start, end) => {
                const selection = getSelection(block, start, end);

                output = Modifier.applyEntity(output, selection, null);
            }
        );
    });

    return output;
}

