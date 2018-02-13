
/**
 * @ngdoc method
 * @name getEntityKeyByOffset
 * @param {Object} content
 * @param {Object} selection
 * @param {Integer} offset
 * @return {String} entity key
 * @description the entity key from the new possition specified by offset.
 */
export function getEntityKeyByOffset(content, selection, offset) {
    const {block, newOffset} = getBlockAndOffset(content, selection, offset);

    if (block == null) {
        return null;
    }

    return block.getEntityAt(newOffset);
}

/**
 * @ngdoc method
 * @name getCharByOffset
 * @param {Object} content
 * @param {Object} selection
 * @param {Integer} offset
 * @return {Char} return char
 * @description the char from the new possition specified by offset.
 */
export function getCharByOffset(content, selection, offset) {
    const {block, newOffset} = getBlockAndOffset(content, selection, offset);

    if (block == null) {
        return null;
    }

    return block.getText()[newOffset];
}

/**
 * @ngdoc method
 * @name getBlockAndOffset
 * @param {Object} content
 * @param {Object} selection
 * @param {Integer} offset
 * @return {Object} return block and offset at new position
 * @description find the block and offset for the new position specified by offset.
 */
const getBlockAndOffset = (content, selection, offset) => {
    let newOffset = selection.getStartOffset() + offset;
    let block = content.getBlockForKey(selection.getStartKey());

    if (block == null) {
        return [null, null];
    }

    while (newOffset < 0) {
        block = content.getBlockBefore(block);
        if (block == null) {
            return [null, null];
        }
        newOffset = block.getLength() - 1 + newOffset;
    }

    while (newOffset > block.getLength()) {
        newOffset = newOffset - block.getLength();
        block = content.getBlockAfter(block);
        if (block == null) {
            return [null, null];
        }
    }

    return {block, newOffset};
};
