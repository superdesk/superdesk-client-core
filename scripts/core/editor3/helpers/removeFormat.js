import {Modifier, EditorState, ContentBlock, ContentState} from 'draft-js';

/*
 * @ngdoc method
 * @name removeInlineStyles
 * @param {Object} editorState
 * @description removes all inline styles from selection
 */
export function removeInlineStyles(editorState) {
    const styles = [
        'BOLD',
        'ITALIC',
        'UNDERLINE',
        'STRIKETHROUGH',
        'CODE',
    ];

    const contentWithoutStyles = styles.reduce((newContentState, style) => (
        Modifier.removeInlineStyle(
            newContentState,
            editorState.getSelection(),
            style
        )
    ), editorState.getCurrentContent());

    return EditorState.push(
        editorState,
        contentWithoutStyles,
        'change-inline-style'
    );
}

const BLOCK_EXCEPTIONS = ['atomic'];

/*
 * @ngdoc method
 * @name removeBlockStyles
 * @param {Object} editorState
 * @description Set all blocks in selection to unstyled except atomic blocks
 */
export function removeBlockStyles(editorState) {
    const content = editorState.getCurrentContent();

    const blockArray = [];

    content.getBlockMap().forEach((block) => {
        if (BLOCK_EXCEPTIONS.includes(block.getType())) {
            blockArray.push(block);
            return;
        }

        blockArray.push(new ContentBlock({
            type: 'unstyled',
            text: block.getText(),
            key: block.getKey(),
            characterList: block.getCharacterList(),
            data: block.getData(),
        }));
    });

    // create new ContentState from Blocks array
    const contentWithoutBlockStyles = ContentState.createFromBlockArray(blockArray);

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
    return removeBlockStyles(removeInlineStyles(editorState));
}
