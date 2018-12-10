import {Modifier, EditorState, EditorChangeType, SelectionState} from 'draft-js';

/**
 * @name clearHighlights
 * @param {ContentState} c The content to clear the highlights in.
 * @param {EditorState=} es If provided, the new content state is pushed into this editor state.
 * @returns {Object} Returns an object that contains two keys, the cleared content state and
 * the new editor state (if it was provided).
 * @description Clears all the highlights in the given content. If an editor state is provided,
 * it also returns it updated.
 */
export const clearHighlights = (c, es = null) => {
    let content = c;
    let editorState = es;
    let changedContent = false;

    const filterFn = (d) => d.hasStyle('HIGHLIGHT') || d.hasStyle('HIGHLIGHT_STRONG');

    content.getBlocksAsArray().forEach((block) => {
        block.findStyleRanges(filterFn,
            (start, end) => {
                const selection = createSelection(block.getKey(), start, end);

                content = Modifier.removeInlineStyle(content, selection, 'HIGHLIGHT');
                content = Modifier.removeInlineStyle(content, selection, 'HIGHLIGHT_STRONG');

                changedContent = true;
            },
        );
    });

    if (changedContent && editorState) {
        editorState = quietPush(editorState, content);
    }

    return {content, editorState};
};

/**
 * @name forEachMatch
 * @param {ContentState} content The content to search in.
 * @param {string} pattern The pattern to search by.
 * @param {boolean} caseSensitive Whether the search should be case sensitive or not.
 * @param {function} cb The callback to call for each occurrence. Receives index, selection and block.
 * @returns {boolean} True if the callback was called.
 * @description Searches the content for the given pattern and calls the given callback
 * for each occurrence, passing it the index of the match and its SelectionState.
 */
export const forEachMatch = (content, pattern, caseSensitive, cb) => {
    if (!pattern) {
        return false;
    }

    let match;
    let matchIndex = -1;

    const re = getRegExp({pattern, caseSensitive});

    content.getBlocksAsArray().forEach((block) => {
        const key = block.getKey();
        const text = block.getText();

        // eslint-disable-next-line no-cond-assign
        while (match = re.exec(text)) {
            cb(
                ++matchIndex,
                createSelection(key, match.index, match.index + pattern.length),
                block,
            );
        }
    });

    return matchIndex > -1;
};

export const getRegExp = ({pattern, caseSensitive}) =>
    new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g' + (caseSensitive ? '' : 'i'));

/**
 * @name quietPush
 * @param {EditorState} editorState
 * @param {ContentState} content
 * @description Silently pushes the new content state into the given editor state, without
 * affecting the undo/redo stack.
 */
export const quietPush = (editorState, content, changeType: EditorChangeType = 'insert-characters') => {
    let newState;

    newState = EditorState.set(editorState, {allowUndo: false});
    newState = EditorState.push(newState, content, changeType);
    newState = EditorState.set(newState, {allowUndo: true});

    return newState;
};

/**
 * Creates a new selection state, based on the given block key, having the specified
 * anchor and offset.
 */
const createSelection = (key: string, start: number, end: number): SelectionState =>
    SelectionState.createEmpty(key).merge({
        anchorOffset: start,
        focusOffset: end,
    }) as SelectionState;
