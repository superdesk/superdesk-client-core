import {Modifier, SelectionState} from 'draft-js';

/**
 * @name removeInlineStyle
 * @description Returns a new content state with all the styles indicated in `styles`
 * removed.
 * @param {ContentState} content
 * @param {Array<string>} styles Styles to remove.
 * @returns {ContentState}
 */
export function removeInlineStyles(content, styles) {
    let contentState = content;
    let filterFn = (c) => styles.some((s) => c.hasStyle(s));

    contentState.getBlocksAsArray().forEach((b) => {
        b.findStyleRanges(filterFn,
            (start, end) => {
                const empty = SelectionState.createEmpty(b.getKey());
                const selection = empty.merge({anchorOffset: start, focusOffset: end});

                styles.forEach((s) => {
                    contentState = Modifier.removeInlineStyle(contentState, selection, s);
                });
            });
    });

    return contentState;
}
