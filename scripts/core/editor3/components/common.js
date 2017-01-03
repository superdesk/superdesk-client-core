import {Entity} from 'draft-js';

/**
 * @description Returns the key belonging to the entity that the start key of the
 * current selection is on.
 * @param {Object} editorState Editor state object.
 * @returns {string} Entity key.
 */
export function getSelectedEntityKey(editorState) {
    const offset = editorState.getSelection().getStartOffset();

    return getSelectedBlock(editorState).getEntityAt(offset);
}

/**
 * @description Returns the entity under the cursor.
 * @param {Object} editorState Editor state object.
 * @returns {Object} Entity.
 */
export function getSelectedEntity(editorState) {
    const entityKey = getSelectedEntityKey(editorState);

    return entityKey !== null ? Entity.get(entityKey) : null;
}

/**
 * @description Returns the entity type under the cursor.
 * @param {Object} editorState Editor state object.
 * @returns {string} Entity type.
 */
export function getSelectedEntityType(editorState) {
    const e = getSelectedEntity(editorState);

    return e !== null ? e.getType() : null;
}

/**
 * @description Returns the entity data under the cursor.
 * @param {Object} editorState Editor state object.
 * @returns {Object} Entity data.
 */
export function getSelectedEntityData(editorState) {
    const e = getSelectedEntity(editorState);

    return e !== null ? e.getData() : {};
}

/**
 * @description Returns the block that the start key of the current selection is on.
 * @param {Object} editorState Editor state object.
 * @returns {Object} Block
 */
export function getSelectedBlock(editorState) {
    const startKey = editorState.getSelection().getStartKey();
    const selectedBlock = editorState
        .getCurrentContent()
        .getBlockForKey(startKey);

    return selectedBlock;
}

/**
 * @description Finds the selected (start key) entity and calls the given function
 * with the start and end offset of the entity within the block.
 * @param {Object} editorState Editor state object.
 * @param {Function} fn Function to call when entity range is found. Parameters of
 * function are start and end.
 */
export function getSelectedEntityRange(editorState, fn) {
    const entityKey = getSelectedEntityKey(editorState);
    const selectedBlock = getSelectedBlock(editorState);

    selectedBlock.findEntityRanges((c) => c.getEntity() === entityKey, fn);
}
