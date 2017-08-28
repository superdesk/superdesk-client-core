/**
 * @module comments
 * @description The comments module contains helpers that allow altering editor and
 * content states by adding, removing, changing and re-calculating the offsets of
 * inline comments.
 */
import {repositionComments} from './offsets';
import {redrawComments, removeInlineStyles, applyInlineStyles} from './styles';
import {getComments, addComment, replaceComments} from './store';

// TODO(gbbr): Weird behaviour around copy/pasting comments around. Can this be fixed?
// TODO(gbbr): Optimize for speed (for 'insert-characters' mostly). Perhaps we can
// redraw only changes?
// TODO(gbbr): Undo resets cursor position.

export {
    repositionComments,
    redrawComments,
    applyInlineStyles,
    removeInlineStyles,
    getComments,
    addComment,
    replaceComments
};
