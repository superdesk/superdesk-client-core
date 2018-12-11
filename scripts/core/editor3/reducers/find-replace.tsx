// eslint complains about imported types not being used
// eslint-disable-next-line no-unused-vars
import {Modifier, EditorState} from 'draft-js';
import {clearHighlights, quietPush, forEachMatch, getRegExp} from '../helpers/find-replace';
import {onChange} from './editor3';

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
    const replaceAt = (pos) =>
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

    const editorStateChanged = onChange(state, editorState);

    return {
        ...editorStateChanged,
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
            i === index ? 'HIGHLIGHT_STRONG' : 'HIGHLIGHT',
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
