import {EditorState, Modifier, SelectionState} from 'draft-js';
import {getComments} from '.';

/**
 * @name redrawComments
 * @description Resets the comment inline styles, returning a new editor state.
 * @param {EditorState} es
 * @returns {EditorState}
 */
export function redrawComments(es) {
    let editorState = es;

    const selection = editorState.getSelection();
    const cleanContent = removeInlineStyles(editorState.getCurrentContent());
    const {contentState, activeComment} = applyInlineStyles(cleanContent, selection);

    editorState = EditorState.set(editorState, {allowUndo: false});
    editorState = EditorState.push(editorState, contentState, 'change-inline-style');
    editorState = EditorState.acceptSelection(editorState, selection);
    editorState = EditorState.set(editorState, {allowUndo: true});

    return {editorState, activeComment};
}

/**
 * @name removeInlineStyle
 * @description Returns a new content state with all the styles indicated in `styles`
 * removed.
 * @param {ContentState} content
 * @param {Array<string>} styles Styles to remove.
 * @returns {ContentState}
 */
export function removeInlineStyles(content, styles = ['COMMENT', 'COMMENT_SELECTED']) {
    let contentState = content;
    let filterFn = (c) => styles.some((s) => c.hasStyle(s));

    contentState.getBlocksAsArray().forEach((b) => {
        b.findStyleRanges(filterFn,
            (start, end) => {
                const empty = SelectionState.createEmpty(b.getKey());
                const selection = empty.merge({anchorOffset: start, focusOffset: end});

                styles.forEach((s) => {
                    contentState = Modifier.removeInlineStyle(contentState, selection, s);
                });
            });
    });

    return contentState;
}

/**
 * @name applyInlineStyles
 * @description Applies inline styling where comments exist in the given content state.
 * Additionally, it also highlights the active comment, if a user selection is supplied.
 * @param {ContentState} contentState The content state from which to read the comment
 * data and to which we apply the inline styling
 * @param {SelectionState} cursor The current selection. If this is set and it
 * overlaps with any comment, it will be highlighted as the active comment.
 * @returns {StateWithComment} Returns the new content state along with the active comment,
 * if one was selected.
 */
export function applyInlineStyles(content, cursor = null) {
    const data = getComments(content);

    if (data.isEmpty()) {
        return {contentState: content};
    }

    let contentState = content;
    let activeComment = null;

    data.mapKeys((rawSelection, comment) => {
        const selection = new SelectionState(JSON.parse(rawSelection));

        if (activeComment === null && selectionIn(content, cursor, selection)) {
            activeComment = {selection: selection, data: comment};
        }

        contentState = Modifier.applyInlineStyle(contentState, selection, 'COMMENT');
    });

    if (activeComment) {
        contentState = Modifier.applyInlineStyle(contentState, activeComment.selection, 'COMMENT_SELECTED');
    }

    return {contentState, activeComment};
}

/**
 * @description Returns true if a is collapsed and is inside b.
 * @param {ContentState} content
 * @param {SelectionState} a
 * @param {SelectionState} b
 * @returns {boolean}
 */
function selectionIn(content, a, b) {
    if (a === null || !a.isCollapsed()) {
        return false;
    }

    const start = b.getAnchorOffset();
    const startKey = b.getAnchorKey();
    const end = b.getFocusOffset();
    const endKey = b.getFocusKey();

    if (startKey === endKey) {
        return a.hasEdgeWithin(startKey, start, end);
    }

    const key = a.getAnchorKey();
    const offset = a.getAnchorOffset();

    if (key === startKey && offset > start ||
        key === endKey && offset < end) {
        return true;
    }

    let k = startKey;

    // eslint-disable-next-line no-cond-assign
    while (k = content.getKeyAfter(k)) {
        if (k === endKey) {
            break;
        }

        if (k === key) {
            return true;
        }
    }

    return false;
}
