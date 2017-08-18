import {EditorState, Modifier, genKey, CharacterMetadata, ContentBlock} from 'draft-js';
import {List, OrderedSet} from 'immutable';
import {fromHTML} from 'core/editor3/html';

/**
 * @ngdoc method
 * @name handlePastedText
 * @param {string} editorKey
 * @param {string} text Text content of paste.
 * @param {string=} html HTML content of paste.
 * @returns {Boolean} True if this method took paste into its own hands.
 * @description Handles pasting into the editor, in cases where the content contains
 * atomic blocks that need special handling in editor3.
 */
export function handlePastedText(editorKey, text, html) {
    if (!html) {
        return false;
    }

    // If there are blocks that have been copied from the host editor, let the editor
    // handle the paste. The chance of having content both from the editor and from
    // outside it as a mix in the clipboard is impossible.
    if (HTMLComesFromEditor(html, editorKey)) {
        return false;
    }

    const {onChange, editorState} = this.props;
    const pastedContent = fromHTML(html);
    const blockMap = pastedContent.getBlockMap();
    const hasAtomicBlocks = blockMap.some((block) => block.getType() === 'atomic');

    if (!hasAtomicBlocks) {
        return false;
    }

    let contentState = Modifier.splitBlock(editorState.getCurrentContent(), editorState.getSelection());
    let selection = contentState.getSelectionAfter();
    let blocks = [];

    blockMap.forEach((block) => {
        if (block.getType() !== 'atomic') {
            return blocks.push(block);
        }

        const entityKey = block.getEntityAt(0);
        const entity = pastedContent.getEntity(entityKey);

        contentState = contentState.addEntity(entity);

        blocks = blocks.concat(
            atomicBlock(block.getData(), contentState.getLastCreatedEntityKey()),
            emptyBlock()
        );
    });

    contentState = Modifier.setBlockType(contentState, selection, 'atomic');
    contentState = Modifier.replaceWithFragment(contentState, selection, OrderedSet(blocks));

    onChange(EditorState.push(editorState, contentState, 'insert-characters'));

    return true;
}

/**
 * @description Checks if the given html contains blocks coming from the editor with
 * key editorKey.
 * @param {string} html
 * @param {string} editorKey
 * @returns {Boolean}
 */
function HTMLComesFromEditor(html, editorKey) {
    const tree = $('<div></div>');

    tree.html(html);

    return $(tree).find(`[data-block="true"][data-editor="${editorKey}"]`).length > 0;
}

/**
 * @ngdoc method
 * @name emptyBlock
 * @returns {ContentBlock}
 * @description Returns an empty block.
 */
const emptyBlock = () => new ContentBlock({
    key: genKey(),
    type: 'unstyled',
    text: '',
    characterList: List()
});

/**
 * @ngdoc method
 * @name emptyBlock
 * @param {Object} data Block data.
 * @param {string} entity Entity key.
 * @returns {ContentBlock}
 * @description Returns an atomic block with the given data, linked to the given
 * entity key.
 */
const atomicBlock = (data, entity) => new ContentBlock({
    key: genKey(),
    type: 'atomic',
    text: ' ',
    characterList: List([CharacterMetadata.create({entity})]),
    data: data
});
