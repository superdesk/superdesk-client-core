// eslint complains about imported types not being used
// eslint-disable-next-line no-unused-vars
import {Modifier, EditorState} from 'draft-js';
import {clearHighlights, quietPush, forEachMatch} from '../helpers/find-replace';
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
    let contentChangedInAll = true;
    let {content, editorState} = clearHighlights(es.getCurrentContent(), es);

    // tries to replace the occurrence at position pos and returns true if successful.
    const replaceAt = (pos, _content) =>
        forEachMatch(_content, pattern, caseSensitive, (i, selection, block, newContent) => {
            if (i === pos) {
                // let's preserve styling and entities (such as links) on replacing
                const styleAt = block.getInlineStyleAt(selection.anchorOffset) || null;
                const entityAt = block.getEntityAt(selection.anchorOffset) || null;

                contentChanged = true;
                contentChangedInAll = true;
                return Modifier.replaceText(newContent, selection, txt, styleAt, entityAt);
            }
            return newContent;
        });

    if (all) {
        // each replace alters the content and changes text offsets, so we need to call this method repeatedly
        while (contentChangedInAll) {
            contentChangedInAll = false;
            content = replaceAt(0, content);
        }
    } else {
        content = replaceAt(index, content);
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

const getNextPattern = (pattern, diff) => {
    if (diff == null || pattern === '') {
        return null;
    }

    const keys = Object.keys(diff);
    const index = keys.indexOf(pattern);

    if (index === -1) {
        return null;
    }

    if (index === keys.length - 1) {
        return keys[0];
    }

    return keys[index + 1];
};

/**
 * @name findNext
 * @param {Object} state
 * @description Increases the highlighted ocurrence index.
 */
const findNext = (state) => {
    const total = countOccurrences(state);
    let {index, pattern, diff} = state.searchTerm;

    if (++index === total) {
        pattern = getNextPattern(pattern, diff) || pattern;
        index = 0;
    }

    return render({
        ...state,
        searchTerm: {...state.searchTerm, index, pattern},
    });
};

const getPrevPattern = (pattern, diff) => {
    if (diff == null || pattern === '') {
        return null;
    }

    const keys = Object.keys(diff);
    const index = keys.indexOf(pattern);

    if (index === -1) {
        return null;
    }

    if (index === 0) {
        return keys[keys.length - 1];
    }

    return keys[index - 1];
};

/**
 * @name findPrev
 * @param {Object} state
 * @description Decreases the highlighted ocurrence index.
 */
const findPrev = (state) => {
    let {index, pattern, diff} = state.searchTerm;

    if (--index < 0) {
        pattern = getPrevPattern(pattern, diff) || pattern;

        const total = countOccurrences({
            ...state,
            searchTerm: {...state.searchTerm, index, pattern},
        });

        index = total - 1;
    }

    return render({
        ...state,
        searchTerm: {...state.searchTerm, index, pattern},
    });
};

/**
 * @name setCriteria
 * @param {Object} state
 * @param {Object} diff
 * @param {boolean} caseSensitive
 * @description Sets the highlight criteria diff and case sensitivity.
 */
const setCriteria = (state, {diff, caseSensitive}) => {
    // If a new pattern is entered, the FindReplaceDirective calls selectNext, so the
    // index needs to become -1. See apps/authoring/editor/find-replace.js.
    // Otherwise, if only the sensitivity is changed, we reset to 0.
    const pattern = diff == null ? '' : Object.keys(diff || {})[0] || '';
    const index = pattern !== state.searchTerm.pattern ? -1 : 0;

    return render({
        ...state,
        searchTerm: {pattern, caseSensitive, index, diff},
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

    let changedContent = false;

    let {content, editorState} = clearHighlights(es.getCurrentContent(), es);

    if (!pattern) {
        return {...state, editorState};
    }

    const newContent = forEachMatch(content, pattern, caseSensitive, (i, selection, block, _newContent) => {
        changedContent = true;

        return Modifier.applyInlineStyle(
            _newContent,
            selection,
            i === index ? 'HIGHLIGHT_STRONG' : 'HIGHLIGHT',
        );
    });

    if (changedContent) {
        editorState = quietPush(editorState, newContent);
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
    const {pattern, caseSensitive} = state.searchTerm;

    let matches = 0;

    forEachMatch(content, pattern, caseSensitive, (i, selection, block, newContent) => {
        matches++;
        return newContent;
    });

    return matches;
};
