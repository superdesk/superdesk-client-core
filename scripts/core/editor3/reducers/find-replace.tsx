import {Modifier, EditorState, SelectionState, ContentState} from 'draft-js';
import {clearHighlights, quietPush, forEachMatch} from '../helpers/find-replace';
import {getData, setDataForContent, getCell, setCell} from '../helpers/table';
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
    const createSelection = (key: string, start: number, end: number): SelectionState =>
    SelectionState.createEmpty(key).merge({
        anchorOffset: start,
        focusOffset: end,
    }) as SelectionState;

    const replaceAtIndex = (pos, _content) =>
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
    const shouldSkipReplacement = (currentText, startPos, posMatch) => {
        if (txt.length <= posMatch.length) {
            return false;
        }

        const endPos = Math.min(startPos + txt.length, currentText.length);
        const textAtCurrentPosition = currentText.substring(startPos, endPos);

        return (
            textAtCurrentPosition === txt ||
        (txt.includes(posMatch) && currentText.substring(startPos, startPos + txt.length) === txt)
        );
    };

    // tslint:disable-next-line:no-shadowed-variable
    const handleBlockReplacement = (content, block, callback) => {
        const key = block.getKey();
        const text = block.getText();
        const entityKey = block.getEntityAt(0);
        const entity = entityKey != null ? content.getEntity(entityKey) : null;

        if (entity != null && entity.getType() === 'TABLE') {
            handleTableReplacement(content, block, callback);
            return;
        }

        handleTextBlockReplacement(content, block, text, callback);
    };

    // tslint:disable-next-line:no-shadowed-variable
    const handleTextBlockReplacement = (content, block, text, callback) => {
        const key = block.getKey();
        let updatedContent = content;
        let changed = false;

        regexp.lastIndex = 0;

        let offsetAdjustment = 0;
        let match;
        const originalText = text;

        while ((match = regexp.exec(originalText)) !== null) {
            const startPos = match.index + offsetAdjustment;
            const endPos = startPos + match[0].length;
            const currentBlock = updatedContent.getBlockForKey(key);
            const currentText = currentBlock.getText();
            const posMatch = match[0];

            if (shouldSkipReplacement(currentText, startPos, posMatch)) {
                continue;
            }

            const selection = createSelection(key, startPos, endPos);
            const styleAt = block.getInlineStyleAt(match.index) || null;
            const entityAt = block.getEntityAt(match.index) || null;

            const replacementResult = Modifier.replaceText(
                updatedContent,
                selection,
                txt,
                styleAt,
                entityAt,
            );

            if (replacementResult !== updatedContent) {
                changed = true;
                updatedContent = replacementResult;

                const newBlock = updatedContent.getBlockForKey(key);
                const newText = newBlock.getText();

                offsetAdjustment += (newText.length - currentText.length);
            }
        }

        callback(updatedContent, changed);
    };

    // tslint:disable-next-line:no-shadowed-variable
    const handleTableReplacement = (content, block, callback) => {
        const key = block.getKey();
        let updatedContent = content;
        let changed = false;

        const selection = createSelection(key, 0, 1);
        const data = getData(updatedContent, key);

        for (let i = 0; i < (data.numRows || 0); i++) {
            for (let j = 0; j < (data.numCols || 0); j++) {
                let cellEditorState = getCell(data, i, j, null, null);

                if (!cellEditorState || !cellEditorState.getCurrentContent()) {
                    continue;
                }

                let cellContent = cellEditorState.getCurrentContent();

                cellContent.getBlocksAsArray().forEach((_block) => {
                    handleCellBlockReplacement(updatedContent, _block, (resultContent, cellChanged) => {
                        updatedContent = resultContent;
                        if (cellChanged) {
                            changed = true;
                        }
                    });
                });

                cellEditorState = EditorState.push(cellEditorState, cellContent, 'insert-characters');
                setCell(data, i, j, cellEditorState);
            }
        }

        const contentWithTableData = setDataForContent(updatedContent, selection, block, data) || content;

        if (!contentWithTableData) {
            callback(content, changed);
            return;
        }

        callback(contentWithTableData, changed);
    };

    // tslint:disable-next-line:no-shadowed-variable
    const handleCellBlockReplacement = (content, block, callback) => {
        let updatedContent = content;
        let changed = false;
        let lengthDifference = 0;
        let text = block.getText();

        regexp.lastIndex = 0;
        let match;

        while ((match = regexp.exec(text)) !== null) {
            const adjustedIndex = match.index + lengthDifference;

            if (adjustedIndex < 0 || adjustedIndex >= text.length) {
                continue;
            }

            const updatedBlock = updatedContent.getBlockForKey(block.getKey());

            if (!updatedBlock) {
                continue;
            }

            const updatedText = updatedBlock.getText();

            if (updatedText.substring(adjustedIndex, adjustedIndex + txt.length) === txt) {
                continue;
            }

            const selection = createSelection(
                block.getKey(),
                adjustedIndex,
                adjustedIndex + match[0].length,
            );

            const anchorOffset = selection.getAnchorOffset();
            const styleAt = block.getInlineStyleAt(anchorOffset) || null;
            const entityAt = block.getEntityAt(anchorOffset) || null;

            changed = true;
            updatedContent = Modifier.replaceText(
                updatedContent,
                selection,
                txt,
                styleAt,
                entityAt,
            );

            lengthDifference += (txt.length - match[0].length);
        }

        callback(updatedContent, changed);
    };

    const replaceAtAll = (initialContent) => {
        if (!regexp) {
            return false;
        }

        let resultContent = initialContent;
        const processBlock = (block, nextBlock) => {
            handleBlockReplacement(resultContent, block, (newContent, blockChanged) => {
                resultContent = newContent;
                if (blockChanged) {
                    contentChanged = true;
                }

                if (nextBlock) {
                    nextBlock();
                }
            });
        };

        const blocks = initialContent.getBlocksAsArray();
        let blockIndex = 0;

        const processNextBlock = () => {
            if (blockIndex < blocks.length) {
                const block = blocks[blockIndex++];

                processBlock(block, blockIndex < blocks.length ? processNextBlock : null);
            }
        };

        if (blocks.length > 0) {
            processNextBlock();
        }

        return contentChanged ? resultContent : false;
    };

    content = all
        ? replaceAtAll(content)
        : typeof index === 'number'
            ? replaceAtIndex(index, content)
            : content;
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
        editorState = EditorState.push(editorState, newContent, 'insert-characters');
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
