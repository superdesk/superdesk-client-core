import {Modifier, EditorState, ContentBlock, ContentState} from 'draft-js';
import {acceptedInlineStyles} from '../helpers/inlineStyles';

/*
 * @ngdoc method
 * @name removeInlineStyles
 * @param {Object} editorState
 * @description removes all inline styles from selection
 */
export function removeInlineStyles(editorState) {
    const contentWithoutStyles = acceptedInlineStyles.reduce(
        (newContentState, style) =>
            Modifier.removeInlineStyle(
                newContentState,
                editorState.getSelection(),
                style
            ),
        editorState.getCurrentContent()
    );

    return EditorState.push(
        editorState,
        contentWithoutStyles,
        'change-inline-style'
    );
}

/*
 * @ngdoc method
 * @name removeBlockStyles
 * @param {Object} editorState
 * @param {Array} keepTypes
 * @description Set all blocks in selection to unstyled except 'keepTypes'
 */
export function removeBlockStyles(editorState, keepTypes) {
    const content = editorState.getCurrentContent();

    const blockArray = content.getBlocksAsArray().map((block) =>
        keepTypes.includes(block.getType())
            ? block
            : new ContentBlock({
                type: 'unstyled',
                text: block.getText(),
                key: block.getKey(),
                characterList: block.getCharacterList(),
                data: block.getData(),
            }));

    // create new ContentState from Blocks array
    const contentWithoutBlockStyles = ContentState.createFromBlockArray(
        blockArray
    );

    return EditorState.push(
        editorState,
        contentWithoutBlockStyles,
        'change-block-type'
    );
}

/*
 * @ngdoc method
 * @name removeFormatFromState
 * @param {Object} editorState
 * @description Set all blocks in selection to unstyled except atomic blocks
 */
export function removeFormatFromState(editorState) {
    return removeBlockStyles(removeInlineStyles(editorState), ['atomic']);
}
