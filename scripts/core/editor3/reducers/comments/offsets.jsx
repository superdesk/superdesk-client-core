import {SelectionState, EditorState} from 'draft-js';
import DiffMatchPatch from 'diff-match-patch';
import {Map} from 'immutable';
import {getComments, replaceComments} from '.';

/**
 * @name repositionComments
 * @description repositionComments returns a new EditorState with the comment offsets
 * updated, making this operation invisible to the undoStack.
 * @param {EditorState} oldState
 * @param {EditorState} newState
 * @returns {EditorState}
 */
export function repositionComments(oldState, newState) {
    if (getComments(oldState.getCurrentContent()).isEmpty()) {
        return newState;
    }

    let editorState = newState;

    editorState = EditorState.set(editorState, {allowUndo: false});
    editorState = updateOffsets(oldState, editorState);
    editorState = EditorState.set(editorState, {allowUndo: true});

    return editorState;
}

/**
 * @name updateOffsets
 * @description updateOffsets checks the last EditorChangeType and if it detects a content
 * change, it returns a new EditorState with the metadata for the comments updated with the
 * correct new start and end positions.
 * @param {EditorState} oldState
 * @param {EditorState} newState
 * @returns {EditorState}
 */
function updateOffsets(oldState, newState) {
    const changeType = newState.getLastChangeType();

    switch (changeType) {
    case 'backspace-character':
    case 'delete-character':
    case 'insert-characters':
    case 'remove-range':
    case 'insert-fragment':
    case 'split-block':
        return diffMethod(oldState, newState);
    default:
        return newState;
    }
}

const dmp = new DiffMatchPatch();

const DiffAdd = 1;
const DiffRemove = -1;
const DiffNoChange = 0;

/* returns string length excluding block separators (\r\n) */
const len = (s) => s.length - (s.match(/\r\n/g) || []).length * 2;

/**
 * @description diffMethod uses DiffMatchPatch to compare the old content to the new
 * content and obtain the new start & end offsets to the existing comments.
 * @param {EditorState} oldState
 * @param {EditorState} newState
 * @returns {EditorState}
 */
function diffMethod(oldState, newState) {
    const oldText = oldState.getCurrentContent().getPlainText('\r\n');
    const newText = newState.getCurrentContent().getPlainText('\r\n');
    const diff = dmp.diff_main(oldText, newText);

    let offset = 0;
    let data = flattenComments(oldState);

    diff.forEach(([changeType, chunk]) => {
        switch (changeType) {
        case DiffNoChange:
            offset += len(chunk);
            break;
        case DiffAdd:
        case DiffRemove:
            data = shift(data, len(chunk) * changeType, offset);
        }
    });

    return stateFromData(newState, data);
}

/**
 * @typedef FlatComment
 * @property {Number} start The absolute start position.
 * @property {Number} end The absolute end position.
 * @property {Comment} data The comment data.
 */

/**
 * @description Shifts all comments (left or right) by `n`, starting at and including
 * `offset`. It correctly removes comments integrally or partially on negative `n`
 * values.
 * @param {Array<FlatComment>} arr Array of flattened comments.
 * @param {Number} n Number of characters to shift. Can be negative for deletion.
 * Note that deletion applies to all characters after offset.
 * @param {Number} offset Offset after which selection ends must be shifted inclusive of offset.
 * @returns {Array<FlatComment>} Array with shifting applied.
 */
export function shift(comments, n, offset = 0) {
    let shifted = [];

    comments.forEach((c) => {
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
 * @description Returns a new EditorState with the new comment data applied.
 * @param {EditorState} editorState
 * @param {Array<FlatComment>} data The array of flattened comments.
 * @returns {EditorState}
 */
function stateFromData(editorState, data) {
    let content = editorState.getCurrentContent();
    let map = {};

    data.forEach((c) => {
        map[createSelection(content, c.start, c.end)] = c.data;
    });

    return replaceComments(editorState, new Map(map));
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

/**
 * @description Creates a new SelectionState based on the given content state
 * and the aboslute character offsets start and end.
 * @param {ContentState} contentState
 * @param {Number} start
 * @param {Number} end
 * @returns {SelectionState}
 */
function createSelection(contentState, start, end) {
    const {key: anchorKey, offset: anchorOffset} = keyAndOffset(contentState, start);
    const {key: focusKey, offset: focusOffset} = keyAndOffset(contentState, end);
    const isBackward = false;
    const selection = new SelectionState({anchorKey, anchorOffset, focusKey, focusOffset, isBackward});

    return JSON.stringify(selection.toJSON());
}

/**
 * @description Returns an array containing all the comments, having all the start
 * and end values as absolute character offsets within the text.
 * @param {EditorState} oldState
 * @returns {Array<FlatComment>}
 */
function flattenComments(oldState) {
    const content = oldState.getCurrentContent();
    const data = getComments(content);

    let flat = [];

    data.mapKeys((rawSelection, data) => {
        const s = new SelectionState(JSON.parse(rawSelection));
        const start = absoluteOffset(content, s.getStartKey(), s.getStartOffset());
        const end = absoluteOffset(content, s.getEndKey(), s.getEndOffset());

        flat.push({data, start, end});
    });

    return flat;
}

/**
 * @description Returns the absolute position for the character at `offset` in block `key`.
 * @param {ContentState} content
 * @param {string} key
 * @param {Number} offset
 * @returns {Number}
 */
export function absoluteOffset(content, key, offset) {
    let blockArray = content.getBlocksAsArray();
    let sum = offset;

    for (let i = 0; i < blockArray.length; i++) {
        if (blockArray[i].getKey() === key) {
            return sum;
        }
        sum += blockArray[i].getLength();
    }

    console.error('block not found editor3/comments/offset.jsx.(charactersUntilBlock)', key);
}
