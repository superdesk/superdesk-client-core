import {SelectionState, EditorState} from 'draft-js';
import DiffMatchPatch from 'diff-match-patch';
import {Map} from 'immutable';
import {getComments, replaceComments} from '.';

/**
 * @name repositionComments
 * @description Returns a new editor state with all the comment offsets updated (based on
 * the last change type).
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
 * @description Returns a new editor state having the comment offset updated, based on
 * the last change that ocurred in the editor.
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
 * @description This function returns a new state with the comment offsets updated.
 * It creates a plain text diff between the old and new content and uses absolute
 * character positionings to simplify the algorithm.
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
            offset += len(chunk) - 1;
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
 * @description Shifts all comments (left or right) by n, starting at offset. It ignores
 * deleted comments and correctly chops off beginning or end parts.
 * @param {Array<FlatComment>} arr Array of flattened comments.
 * @param {Number} count Number of characters to shift. Can be negative for shifting left.
 * @param {Number} start Offset after which selection ends must be shifted.
 * @returns {Array<FlatComment>} Array with shifting applied.
 */
function shift(comments, n, offset = 0) {
    let shifted = [];

    comments.forEach((c) => {
        // deleted
        if (n < 0 && c.start > offset && c.end > offset && c.start <= offset - n && c.end <= offset - n + 1) {
            return;
        }
        // start is chopped off or shifted n
        if (c.start > offset + 1) {
            c.start += n < 0 && offset - n >= c.start ? offset - c.start + 1 : n;
        }
        // end is chopped off or shifted n
        if (c.end > offset) {
            c.end += n < 0 && offset - n + 1 > c.end ? offset - c.end + 1 : n;
        }

        shifted.push(c);
    });

    return shifted;
}

/**
 * @description Returns a new editor state with the given comment data applied.
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
function keyAndOffset(contentState, n) {
    const blocks = contentState.getBlocksAsArray();

    let sum = 0;
    let lastSum = 0;
    let blockOffset = 0;
    let offset = 0;

    for (let i = 0; i < blocks.length; i++) {
        sum += blocks[i].getLength();

        if (sum > n) {
            offset = n - lastSum;
            break;
        }

        blockOffset++;
        lastSum = sum;
    }

    const key = blocks[blockOffset].getKey();

    return {key, offset};
}

/**
 * @description Creates a new selection object based on the given content state
 * and the aboslute character offsets start and end.
 * @param {ContentState} contentState
 * @param {Number} start
 * @param {Number} end
 * @returns {SelectionState}
 */
function createSelection(contentState, start, end) {
    const {
        key: anchorKey,
        offset: anchorOffset
    } = keyAndOffset(contentState, start);

    const {
        key: focusKey,
        offset: focusOffset
    } = keyAndOffset(contentState, end);

    const selection = new SelectionState({
        anchorKey,
        focusKey,
        anchorOffset,
        focusOffset
    });

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
        const start = absoluteOffset(content, s.getAnchorKey(), s.getAnchorOffset());
        const end = absoluteOffset(content, s.getFocusKey(), s.getFocusOffset());

        flat.push({data, start, end});
    });

    return flat;
}

/**
 * @description Returns the absolute position for the character at offset in block key.
 * @param {ContentState} content
 * @param {string} key
 * @param {Number} offset
 * @returns {Number}
 */
function absoluteOffset(content, key, offset) {
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
