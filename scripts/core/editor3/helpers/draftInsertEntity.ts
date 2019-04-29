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
    targetBlockKey = null,
): EditorState {
    const contentStateWithEntity = editorState.getCurrentContent().createEntity(draftEntityType, mutability, data);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const contentBlock = new ContentBlock({
        key: genKey(),
        type: 'atomic',
        text: ' ',
        characterList: List(Repeat(CharacterMetadata.create({entity: entityKey}), 1)),
    });
    const targetBlockKeyFinal = targetBlockKey != null ? targetBlockKey : editorState.getSelection().getEndKey();
    const contentStateWithBlockInserted = insertBlock(contentStateWithEntity, contentBlock, targetBlockKeyFinal);

    return EditorState.push(editorState, contentStateWithBlockInserted, 'insert-fragment');
}

// inserts a block after a given block key
function insertBlock(contentState: ContentState, blockToInsert: ContentBlock, afterKey: string): ContentState {
    const blocksArray: Array<ContentBlock> = [];

    contentState.getBlocksAsArray().forEach((block) => {
        blocksArray.push(block);

        const key = block.getKey();

        if (key === afterKey) {
            blocksArray.push(blockToInsert);
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
