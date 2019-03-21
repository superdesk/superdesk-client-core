import {Modifier, SelectionState, EditorState, ContentBlock, ContentState} from 'draft-js';
import {acceptedInlineStyles} from '../helpers/inlineStyles';
import {blockInsideSelection} from '../helpers/selection';

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
                    contentState = Modifier.removeInlineStyle(contentState, selection as SelectionState, s);
                });
            });
    });

    return contentState;
}

/*
 * @ngdoc method
 * @name removeInlineStylesForSelection
 * @param {Object} content ContentState
 * @param {Object} selection SelectionState
 * @description Remove all inline styles from selection
 * @return {Object} ContentState
 */
export function removeInlineStylesForSelection(content, selection) {
    const contentWithoutStyles = acceptedInlineStyles.reduce(
        (newContentState, style) =>
            Modifier.removeInlineStyle(newContentState, selection, style),
        content,
    );

    return contentWithoutStyles;
}

/*
 * @ngdoc method
 * @name removeBlockStyles
 * @param {Object} editorState
 * @param {Object} content ContentState
 * @param {Object} selection SelectionState
 * @description Set all blocks in selection to unstyled except keepTypes
 * @return {Object} ContentState
 */
export function removeBlockStyles(editorState, content, selection, keepTypes) {
    const blockArray = content.getBlocksAsArray().map((block) => {
        const shouldRemoveStyle =
            block.getType() !== 'unstyled' &&
            !keepTypes.includes(block.getType()) &&
            blockInsideSelection(editorState, block.getKey());

        if (!shouldRemoveStyle) {
            return block;
        }

        return new ContentBlock({
            type: 'unstyled',
            text: block.getText(),
            key: block.getKey(),
            characterList: block.getCharacterList(),
            data: block.getData(),
        });
    });

    return ContentState.createFromBlockArray(blockArray);
}

/*
 * @ngdoc method
 * @name removeFormatFromState
 * @param {Object} editorState
 * @description Set all blocks in selection to unstyled except atomic blocks
 * @return {Object} EditorState
 */
export function removeFormatFromState(editorState) {
    const selection = editorState.getSelection();
    const contentWithoutInlineStyles = removeInlineStylesForSelection(
        editorState.getCurrentContent(),
        selection,
    );
    const contentWithoutBlockStyles = removeBlockStyles(
        editorState,
        contentWithoutInlineStyles,
        selection,
        ['atomic'],
    );

    // Push new editor state as only one change so 'UNDO' will change both at the same type
    return EditorState.push(
        editorState,
        contentWithoutBlockStyles,
        'change-block-type',
    );
}
