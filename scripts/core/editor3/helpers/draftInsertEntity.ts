import {
    EditorState,
    ContentState,
    ContentBlock,
    BlockMapBuilder,
    Modifier,
    SelectionState,
    genKey,
    CharacterMetadata,
} from 'draft-js';
import {List, Repeat} from 'immutable';
import {isSelectionAtStartOfBlock} from './selectionPositionInBlock';

export function insertEntity(
    editorState: EditorState,
    draftEntityType,
    mutability,
    data,
    targetBlockKeyInitial = null,
): EditorState {
    const targetBlockKey = targetBlockKeyInitial != null
        ? targetBlockKeyInitial
        : editorState.getSelection().getEndKey();
    const contentState = editorState.getCurrentContent().createEntity(draftEntityType, mutability, data);
    const entityKey = contentState.getLastCreatedEntityKey();
    let blocksToInsert: Array<ContentBlock> = [];

    if (contentState.getBlockForKey(targetBlockKey).getType() === 'atomic') {
        // ensure there's always an empty text block between 2 atomic blocks
        // so user can place a cursor between atomic blocks.
        blocksToInsert.push(ContentState.createFromText(' ').getFirstBlock());
    }

    blocksToInsert.push(
        new ContentBlock({
            key: genKey(),
            type: 'atomic',
            text: ' ',
            characterList: List(Repeat(CharacterMetadata.create({entity: entityKey}), 1)),
        }),
    );

    const blockShouldBeInsertedBeforeSelection = isSelectionAtStartOfBlock(editorState);
    const adjacentBlock = blockShouldBeInsertedBeforeSelection
        ? contentState.getBlockBefore(targetBlockKey)
        : contentState.getBlockAfter(targetBlockKey);

    if (adjacentBlock == null || adjacentBlock.getType() === 'atomic') {
        // ensure there's always an empty text block between 2 atomic blocks
        blocksToInsert = blockShouldBeInsertedBeforeSelection
            ? [ContentState.createFromText(' ').getFirstBlock(), ...blocksToInsert] // atomic block won't be first
            : [...blocksToInsert, ContentState.createFromText(' ').getFirstBlock()] // atomic block won't be last
        ;
    }

    const contentStateWithBlockInserted = blockShouldBeInsertedBeforeSelection
        ? insertBlocksBefore(contentState, blocksToInsert, targetBlockKey)
        : insertBlocksAfter(contentState, blocksToInsert, targetBlockKey);

    return EditorState.push(editorState, contentStateWithBlockInserted, 'insert-fragment');
}

function insertBlocks(
    contentState: ContentState,
    blocksToInsert,
    nextToKey: string,
    position: 'before' | 'after',
) {
    const blocksArray: Array<ContentBlock> = [];

    contentState.getBlocksAsArray().forEach((block) => {
        if (block.getKey() === nextToKey) {
            if (position === 'after') {
                blocksArray.push(...[block, ...blocksToInsert]);
            } else if (position === 'before') {
                blocksArray.push(...[...blocksToInsert, block]);
            } else {
                console.warn('Wrong argument `position` in `insertBlocks` function');
            }
        } else {
            blocksArray.push(block);
        }
    });

    const selection = new SelectionState({
        anchorKey: contentState.getFirstBlock().getKey(),
        anchorOffset: 0,
        focusKey: contentState.getLastBlock().getKey(),
        focusOffset: contentState.getLastBlock().getLength(),
        isBackward: false,
        hasFocus: false,
    });

    return Modifier.replaceWithFragment(contentState, selection, BlockMapBuilder.createFromArray(blocksArray));
}

export function insertBlocksAfter(
    contentState: ContentState,
    blocksToInsert: Array<ContentBlock>,
    afterKey: string,
): ContentState {
    return insertBlocks(contentState, blocksToInsert, afterKey, 'after');
}

export function insertBlocksBefore(
    contentState: ContentState,
    blocksToInsert: Array<ContentBlock>,
    beforeKey: string,
): ContentState {
    return insertBlocks(contentState, blocksToInsert, beforeKey, 'before');
}
