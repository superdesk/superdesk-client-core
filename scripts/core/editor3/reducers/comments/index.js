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

// TODO(gbbr): Can not make a selection when the Comment Input is visible.
// TODO(gbbr): Pimp up CommentInput.
// TODO(gbbr): Use react-textarea-autosize in CommentInput to allow multi-line comments.
// TODO(gbbr): Weird behaviour around copy/pasting comments around. Can this be fixed?

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
