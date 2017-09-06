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

// TODO(gbbr): Remove commenting from all fields except body.
// TODO(gbbr): Make sure save works when adding only a comment, and no content.
// TODO(gbbr): Pimp up CommentInput.
// TODO(gbbr): Use react-textarea-autosize in CommentInput to allow multi-line comments.

// TODO(gbbr): Weird behaviour around copy/pasting comments around. Can this be fixed?
// TODO(gbbr): Optimize for speed (for 'insert-characters' mostly). Perhaps we can
// redraw only changes?

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
