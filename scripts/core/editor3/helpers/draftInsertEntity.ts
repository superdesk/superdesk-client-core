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

    const blocksToInsert: Array<ContentBlock> = [];

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

    const blockAfter = contentState.getBlockAfter(targetBlockKey);

    if (blockAfter == null || blockAfter.getType() === 'atomic') {
        // ensure there's always an empty text block between 2 atomic blocks
        // ensure an atomic block is never last
        blocksToInsert.push(ContentState.createFromText(' ').getFirstBlock());
    }

    const contentStateWithBlockInserted = insertBlocksAfter(contentState, blocksToInsert, targetBlockKey);

    return EditorState.push(editorState, contentStateWithBlockInserted, 'insert-fragment');
}

// inserts blocks after a given block key
function insertBlocksAfter(
    contentState: ContentState,
    blocksToInsert: Array<ContentBlock>,
    afterKey: string,
): ContentState {
    const blocksArray: Array<ContentBlock> = [];

    contentState.getBlocksAsArray().forEach((block) => {
        blocksArray.push(block);

        if (block.getKey() === afterKey) {
            blocksToInsert.forEach((blockToInsert) => {
                blocksArray.push(blockToInsert);
            });
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
