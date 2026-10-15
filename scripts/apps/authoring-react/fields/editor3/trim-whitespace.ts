import {ContentState} from 'draft-js';
import {replaceAllForEachBlock} from 'core/editor3/helpers/find-replace';

/**
 * Normalizes whitespace before storing an editor3 value.
 * Atomic blocks are left untouched, see `replaceAllForEachBlock`.
 */
export function trimWhitespaceForStorage(contentState: ContentState): ContentState {
    let result = contentState;

    // trim whitespace at the beginning of each block
    result = replaceAllForEachBlock(result, /^\s+/g, '');

    // trim whitespace at the end of each block
    result = replaceAllForEachBlock(result, /\s+$/g, '');

    // replace multiple spaces with a single space
    result = replaceAllForEachBlock(result, /\s\s+/g, ' ');

    return result;
}
