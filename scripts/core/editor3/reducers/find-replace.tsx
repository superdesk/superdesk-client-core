import {SelectionState, Modifier, EditorState, EditorChangeType} from 'draft-js';

const findReplace = (state = {}, action) => {
    switch (action.type) {
    case 'HIGHLIGHTS_FIND_NEXT':
        return findNext(state);
    case 'HIGHLIGHTS_FIND_PREV':
        return findPrev(state);
    case 'HIGHLIGHTS_REPLACE':
        return replaceHighlight(state, action.payload);
    case 'HIGHLIGHTS_REPLACE_ALL':
        return replaceHighlight(state, action.payload, true);
    case 'HIGHLIGHTS_RENDER':
        return render(state);
    case 'HIGHLIGHTS_CRITERIA':
        return setCriteria(state, action.payload);
    default:
        return state;
    }
};

/**
 * @name replaceHighlight
 * @param {Object} state
 * @param {string} txt The text to replace the highlight with
 * @param {boolean=} all If set to true, it replaces all occurences, otherwise it replaces
 * only the current one.
 * @description Replaces highlights with the given text.
 */
const replaceHighlight = (state, txt, all = false) => {
    const {index, pattern, caseSensitive} = state.searchTerm;
    const es = state.editorState;

    let contentChanged = false;
    let {content, editorState} = clearHighlights(es.getCurrentContent(), es);

    // tries to replace the occurrence at position pos and returns true if successful.
    let replaceAt = (pos) =>
        forEachMatch(content, pattern, caseSensitive, (i, selection, block) => {
            if (i === pos) {
                // let's preserve styling and entities (such as links) on replacing
                const styleAt = block.getInlineStyleAt(selection.anchorOffset) || null;
                const entityAt = block.getEntityAt(selection.anchorOffset) || null;

                content = Modifier.replaceText(content, selection, txt, styleAt, entityAt);
                contentChanged = true;
            }
        });

    if (all) {
        // each replace alters the content and changes text offsets, so we need to call this method repeatedly
        while (replaceAt(0)) { /* no-op */ }
    } else {
        replaceAt(index);
    }

    if (contentChanged) {
        editorState = EditorState.push(editorState, content, 'insert-characters');
    }

    return {
        ...state,
        editorState: editorState,
        searchTerm: {
            ...state.searchTerm,
            // if we replaced the occurrence, index decreases
            index: contentChanged && !all ? index - 1 : index,
        },
    };
};

/**
 * @name findNext
 * @param {Object} state
 * @description Increases the highlighted ocurrence index.
 */
const findNext = (state) => {
    const i = state.searchTerm.index + 1;
    const total = countOccurrences(state);
    const index = i === total ? 0 : i;

    return render({
        ...state,
        searchTerm: {...state.searchTerm, index},
    });
};

/**
 * @name findNext
 * @param {Object} state
 * @description Decreases the highlighted ocurrence index.
 */
const findPrev = (state) => {
    const i = state.searchTerm.index - 1;
    const total = countOccurrences(state);
    const index = i < 0 ? total - 1 : i;

    return render({
        ...state,
        searchTerm: {...state.searchTerm, index},
    });
};

/**
 * @name setCriteria
 * @param {Object} state
 * @param {string} pattern
 * @param {boolean} caseSensitive
 * @description Sets the highlight criteria pattern and case sensitivity.
 */
const setCriteria = (state, {pattern, caseSensitive}) => {
    // If a new pattern is entered, the FindReplaceDirective calls selectNext, so the
    // index needs to become -1. See apps/authoring/editor/find-replace.js.
    // Otherwise, if only the sensitivity is changed, we reset to 0.
    const index = pattern !== state.searchTerm.pattern ? -1 : 0;

    return render({
        ...state,
        searchTerm: {pattern, caseSensitive, index},
    });
};

/**
 * @name render
 * @param {Object} state
 * @description Renders the search criteria in the state.
 */
const render = (state) => {
    const {pattern, index, caseSensitive} = state.searchTerm;
    const es = state.editorState;

    let {content, editorState} = clearHighlights(es.getCurrentContent(), es);

    if (!pattern) {
        return {...state, editorState};
    }

    const changedContent = forEachMatch(content, pattern, caseSensitive, (i, selection) => {
        content = Modifier.applyInlineStyle(
            content,
            selection,
            i === index ? 'HIGHLIGHT_STRONG' : 'HIGHLIGHT'
        );
    });

    if (changedContent) {
        editorState = quietPush(editorState, content);
    }

    return {...state, editorState};
};

export default findReplace;

/**
 * @name countOccurences
 * @param {Object} state
 * @description Returns the number of occurences of the search criteria inside the current editor content.
 */
export const countOccurrences = (state) => {
    const content = state.editorState.getCurrentContent();
    const re = getRegExp(state.searchTerm);

    let matches = 0;

    content.getBlocksAsArray().forEach((block) => {
        matches += (block.getText().match(re) || []).length;
    });

    return matches;
};

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

    const filterFn = (c) => c.hasStyle('HIGHLIGHT') || c.hasStyle('HIGHLIGHT_STRONG');

    content.getBlocksAsArray().forEach((block) => {
        block.findStyleRanges(filterFn,
            (start, end) => {
                const selection = createSelection(block.getKey(), start, end);

                content = Modifier.removeInlineStyle(content, selection, 'HIGHLIGHT');
                content = Modifier.removeInlineStyle(content, selection, 'HIGHLIGHT_STRONG');

                changedContent = true;
            }
        );
    });

    if (changedContent && editorState) {
        editorState = quietPush(editorState, content);
    }

    return {content, editorState};
};


/**
 * Creates a new selection state, based on the given block key, having the specified
 * anchor and offset.
 */
const createSelection = (key: string, start: number, end: number) : SelectionState =>
    SelectionState.createEmpty(key).merge({
        anchorOffset: start,
        focusOffset: end,
    }) as SelectionState;

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
                block
            );
        }
    });

    return matchIndex > -1;
};

const getRegExp = ({pattern, caseSensitive}) =>
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
