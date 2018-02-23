/**
 * @typedef FlatHighlight
 * @property {Number} start The absolute start position.
 * @property {Number} end The absolute end position.
 * @property {Highlight} data The highlight data.
 */

/**
 * @description Shifts all higlights (left or right) by `n`, starting at and including
 * `offset`. It correctly removes higlights integrally or partially on negative `n`
 * values.
 * @param {Array<FlatHighlights>} arr Array of flattened highlights.
 * @param {Number} n Number of characters to shift. Can be negative for deletion.
 * Note that deletion applies to all characters after offset.
 * @param {Number} offset Offset after which selection ends must be shifted inclusive of offset.
 * @returns {Array<FlatHighlight>} Array with shifting applied.
 */
export function shift(highlights, n, offset = 0) {
    let shifted = [];

    highlights.forEach((c) => {
        if (n < 0
            && c.start >= offset && c.start <= offset - n
            && c.end > offset && c.end <= offset - n) {
            // deleted
            return;
        }
        if (c.start >= offset) {
            // start is chopped off or shifted n
            c.start += n < 0 && c.start <= offset - n ? offset - c.start : n;
        }
        if (c.end > offset) {
            // end is chopped off or shifted n
            c.end += n < 0 && c.end < offset - n ? offset - c.end : n;
        }

        shifted.push(c);
    });

    return shifted;
}

/**
 * @typedef KeyAndOffset
 * @property {string} key The block key.
 * @property {Number} offset The offset in characters relative to the block.
 */

/**
 * @description Returns the block key and the character offset relative to that
 * block given the absolute character position `n`.
 * @param {ContentState} contentState
 * @param {Number} char
 * @returns {KeyAndOffset}
 */
export function keyAndOffset(contentState, n) {
    const blocks = contentState.getBlocksAsArray();
    const blockCount = blocks.length;

    let sum = 0;
    let lastSum = 0;
    let i = 0;
    let offset = 0;

    for (; i < blockCount; i++) {
        sum += blocks[i].getLength();

        if (sum >= n) {
            offset = n - lastSum;
            if (sum === n && i < blockCount - 1) {
                offset = 0;
                i++;
            }
            break;
        }

        lastSum = sum;
    }

    const blockOffset = i === blockCount ? i - 1 : i;
    const key = blocks[blockOffset].getKey();

    return {key, offset};
}