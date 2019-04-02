// eslint complains about imported types not being used
// eslint-disable-next-line no-unused-vars
import {Modifier, EditorState} from 'draft-js';
import {clearHighlights, quietPush, forEachMatch} from '../helpers/find-replace';
import {onChange} from './editor3';
import {escapeRegExp} from 'core/utils';

interface IDiff { [s: string]: string; }

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
    const {index, pattern, caseSensitive, diff} = state.searchTerm;
    const es = state.editorState;

    let contentChanged = false;
    let contentChangedInAll = true;
    let {content, editorState} = clearHighlights(es.getCurrentContent(), es);

    const regexp = getRegExp(diff, pattern, caseSensitive);

    // tries to replace the occurrence at position pos and returns true if successful.
    const replaceAt = (pos, _content) =>
        forEachMatch(_content, regexp, caseSensitive, (i, selection, block, newContent) => {
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

/**
 * @name findNext
 * @param {Object} state
 * @description Increases the highlighted ocurrence index.
 */
const findNext = (state) => {
    const matches = getMatches(state);
    let {index, diff} = state.searchTerm;

    if (++index >= matches.length) {
        index = 0;
    }

    const pattern = matches[index];

    return render({
        ...state,
        searchTerm: {...state.searchTerm, index, pattern, diff},
    });
};

/**
 * @name findPrev
 * @param {Object} state
 * @description Decreases the highlighted ocurrence index.
 */
const findPrev = (state) => {
    const matches = getMatches(state);
    let {index, diff} = state.searchTerm;

    if (--index < 0) {
        index = matches.length - 1;
    }

    const pattern = matches[index];

    return render({
        ...state,
        searchTerm: {...state.searchTerm, index, pattern, diff},
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
    const {index, caseSensitive, diff, pattern} = state.searchTerm;
    const es = state.editorState;

    let changedContent = false;
    let {content, editorState} = clearHighlights(es.getCurrentContent(), es);

    if (isEmptyDiff(diff) && !pattern) {
        return {...state, editorState};
    }

    const reg = getRegExp(diff, pattern, caseSensitive);

    const newContent = forEachMatch(content, reg, caseSensitive, (i, selection, block, _newContent) => {
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
 * @name getMatches
 * @param {Object} state
 * @description Returns the matching occurences of the search criteria inside the current editor content.
 */
const getMatches = (state) => {
    const content = state.editorState.getCurrentContent();
    const {caseSensitive, diff, pattern} = state.searchTerm;
    const matches = [];

    if (isEmptyDiff(diff) && !pattern) {
        return matches;
    }

    const combinedPattern = getRegExp(diff, pattern, caseSensitive);

    forEachMatch(content, combinedPattern, caseSensitive, (i, selection, block, newContent, match) => {
        matches.push(match);

        return newContent;
    });

    return matches;
};

const getRegExp = (diff: IDiff, pattern: string, caseSensitive: boolean) => {
    let reg = pattern ? escapeRegExp(pattern) : '';

    // if there is diff make regexp for all keys at once
    // so it will highlight all matches
    if (!isEmptyDiff(diff)) {
        reg = Object.keys(diff)
            .filter((_pattern) => _pattern.length > 0) // non empty
            .sort((a, b) => b.length - a.length) // longest first
            .map(escapeRegExp)
            .join('|');
    }

    return new RegExp(reg, 'g' + (caseSensitive ? '' : 'i'));
};

// test if diff has all keys empty
const isEmptyDiff = (diff: IDiff) => Object.keys(diff || {}).filter((key) => key.length).length === 0;
