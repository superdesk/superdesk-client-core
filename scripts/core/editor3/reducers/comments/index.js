/**
 * @module comments
 * @description The comments module contains helpers that allow altering editor and
 * content states by adding, removing, changing and re-calculating the offsets of
 * inline comments.
 */
import {repositionComments} from './offsets';
import {redrawComments, removeInlineStyles, applyInlineStyles} from './styles';
import {getComments, addComment, replaceComments} from './store';
import {updateComments} from './comments';

export {
    repositionComments,
    redrawComments,
    applyInlineStyles,
    removeInlineStyles,
    getComments,
    addComment,
    replaceComments,
    updateComments,
};
