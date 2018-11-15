import {EditorState} from 'draft-js';
import insertAtomicBlockWithoutEmptyLines from "./insertAtomicBlockWithoutEmptyLines";
import {moveBlockWithoutDispatching} from "./draftMoveBlockWithoutDispatching";

export function insertEntity(editorState, draftEntityType, mutability, data, targetBlockKey = null): EditorState {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(draftEntityType, mutability, data);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    const insertResult = insertAtomicBlockWithoutEmptyLines(
        editorState,
        entityKey,
        ' ',
    );

    let stateWithBlock = insertResult.editorState;
    const newBlockKey = insertResult.blockKey;

    if (targetBlockKey) {
        stateWithBlock = moveBlockWithoutDispatching(
            {editorState: stateWithBlock},
            {
                block: newBlockKey,
                dest: targetBlockKey,
                insertionMode: 'after',
            },
        ).editorState;
    }

    return stateWithBlock;
}
