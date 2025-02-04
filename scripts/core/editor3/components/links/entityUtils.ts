import {EditorState} from 'draft-js';

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
    const contentState = editorState.getCurrentContent();

    return entityKey !== null ? contentState.getEntity(entityKey) : null;
}

/**
 * @description Merge entity data of selected entity
 * @param {Object} editorState Editor state object.
 * @param {Object} data to merge.
 * @returns {Object} Editor state.
 */
export function mergeSelectedEntityData(editorState, data) {
    const entityKey = getSelectedEntityKey(editorState);
    const contentState = editorState.getCurrentContent();

    return EditorState.push(
        editorState,
        contentState.mergeEntityData(entityKey, data),
        'change-block-data',
    );
}

/**
 * @description Replace entity data of selected entity
 * @param {Object} editorState Editor state object.
 * @param {Object} data to merge.
 * @returns {Object} Editor state.
 */
export function replaceSelectedEntityData(editorState, data) {
    const entityKey = getSelectedEntityKey(editorState);
    const contentState = editorState.getCurrentContent();

    return EditorState.push(
        editorState,
        contentState.replaceEntityData(entityKey, data),
        'change-block-data',
    );
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

/**
 * @description Gets the entity type of the entity located on the same spot as the
 * cursor. If offset is set, it gets the entity type offset to the cursor.
 * @param {EditorState} editorState
 * @param {Number} offset Offset to cursor. Negative is allowed.
 * @returns {string} Entity type.
 */
export function getEntityTypeOffsetToCursor(editorState, offset = 0) {
    const selection = editorState.getSelection();
    const selectedBlock = getSelectedBlock(editorState);
    const focusOffset = selection.getFocusOffset();
    const targetOffset = focusOffset + offset;

    if (targetOffset < 0 || targetOffset > selectedBlock.getText().length) {
        return null;
    }

    const selectedEntityKey = selectedBlock.getEntityAt(focusOffset + offset);

    if (selectedEntityKey === null) {
        return null;
    }

    const contentState = editorState.getCurrentContent();
    const selectedEntity = contentState.getEntity(selectedEntityKey);

    return selectedEntity !== null ? selectedEntity.getType() : null;
}

/**
 * @description Gets the entity type of the entity located after (at) the cursor.
 * @param {EditorState} editorState
 * @returns {string} Entity type.
 */
export function getEntityTypeAfterCursor(editorState) {
    return getEntityTypeOffsetToCursor(editorState);
}

/**
 * @description Gets the entity type of the entity located before the cursor.
 * @param {EditorState} editorState
 * @returns {string} Entity type.
 */
export function getEntityTypeBeforeCursor(editorState) {
    return getEntityTypeOffsetToCursor(editorState, -1);
}
