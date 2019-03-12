import {EditorState, SelectionState, Modifier} from 'draft-js';

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
 * @param {Array} inlineStyles
 * @returns {ContentState}
 */

export function sanitizeContent(editorState, inlineStyles = acceptedInlineStyles) {
    let contentState = editorState.getCurrentContent();

    const ignoreStyle = (style) => inlineStyles.indexOf(style) === -1;
    const getSelection = (block, start, end) => SelectionState.createEmpty(block.getKey()).merge({
        anchorOffset: start,
        focusOffset: end,
    });

    let nextEditorState = editorState;

    contentState.getBlockMap().forEach((block) => {
        // remove extra styles
        block.findStyleRanges(
            (character) => character.getStyle().some(ignoreStyle),
            (start, end) => {
                const selection = getSelection(block, start, end);
                const inlineStyle = block.getInlineStyleAt(start).find(ignoreStyle);

                contentState = Modifier.removeInlineStyle(contentState, selection as SelectionState, inlineStyle);
            },
        );
    });

    nextEditorState = EditorState.push(
        nextEditorState,
        contentState,
        'change-inline-style',
    );

    nextEditorState = EditorState.push(
        nextEditorState,
        contentState,
        'apply-entity',
    );

    return nextEditorState;
}
