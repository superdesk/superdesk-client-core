import {Modifier, EditorState, ContentBlock, ContentState} from 'draft-js';
import {acceptedInlineStyles} from '../helpers/inlineStyles';

/*
 * @ngdoc method
 * @name removeInlineStyles
 * @param {Object} content ContentState
 * @param {Object} selection SelectionState
 * @description Remove all inline styles from selection
 * @return {Object} ContentState
 */
export function removeInlineStyles(content, selection) {
    const contentWithoutStyles = acceptedInlineStyles.reduce(
        (newContentState, style) =>
            Modifier.removeInlineStyle(
                newContentState,
                selection,
                style
            ),
        content
    );

    return contentWithoutStyles;
}

/*
 * @ngdoc method
 * @name removeBlockStyles
 * @param {Object} content ContentState
 * @param {Object} selection SelectionState
 * @description Set all blocks in selection to unstyled except keepTypes
 * @return {Object} ContentState
 */
export function removeBlockStyles(content, selection, keepTypes) {
    const blockArray = content.getBlocksAsArray().map(
        (block) =>
            keepTypes.includes(block.getType())
                ? block
                : new ContentBlock({
                    type: 'unstyled',
                    text: block.getText(),
                    key: block.getKey(),
                    characterList: block.getCharacterList(),
                    data: block.getData(),
                })
    );

    return ContentState.createFromBlockArray(
        blockArray
    );
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
    const contentWithoutInlineStyles = removeInlineStyles(editorState.getCurrentContent(), selection);
    const contentWithoutBlockStyles = removeBlockStyles(contentWithoutInlineStyles, selection, ['atomic']);

    // Push new editor state as only one change so 'UNDO' will change both at the same type
    return EditorState.push(editorState, contentWithoutBlockStyles, 'change-block-type');
}
