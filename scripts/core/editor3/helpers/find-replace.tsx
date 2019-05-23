import {Modifier, EditorState, EditorChangeType, SelectionState} from 'draft-js';
import {getData, setDataForContent, getCell, setCell} from './table';
import {escapeRegExp} from 'core/utils';

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

    content = forEachBlock(content, (blockIndex, block, _content) => {
        let newContent = _content;

        block.findStyleRanges(filterFn,
            (start, end) => {
                const selection = createSelection(block.getKey(), start, end);

                newContent = Modifier.removeInlineStyle(newContent, selection, 'HIGHLIGHT');
                newContent = Modifier.removeInlineStyle(newContent, selection, 'HIGHLIGHT_STRONG');

                changedContent = true;
            },
        );

        return newContent;
    });

    if (changedContent && editorState) {
        editorState = quietPush(editorState, content);
    }

    return {content, editorState};
};

/**
 * @name forEachBlock
 * @param {ContentState} content The content to interate over.
 * @param {function} cb The callback to call for each block. Receives index, block and content.
 * @returns {ContentState} returns  the new content state.
 * @description Iterates over blocks in  conntent and calls the given callback
 * for each block, passing it current index, block and content.
 */
export const forEachBlock = (content, cb) => {
    let newContent = content;

    content.getBlocksAsArray().forEach((block) => {
        const entityKey = block.getEntityAt(0);
        const entity = entityKey != null ? content.getEntity(entityKey) : null;

        let blockIndex = -1;

        if (entity != null && entity.getType() === 'TABLE') {
            ({newContent, blockIndex} = forEachBlockInTable(newContent, block, blockIndex, cb));
        } else {
            newContent = cb(++blockIndex, block, newContent);
        }
    });

    return newContent;
};

/**
 * @name forEachBlockInTable
 * @param {ContentState} content The content to iterate  over.
 * @param {String} the block that contains the table.
 * @param {number} current marching index
 * @param {function} cb The callback to call for each block. Receives index, block and content.
 * @returns {ContentState} returns  the new content state.
 * @description Iterates the table content and calls the given callback
 * for each block, passing it current index, block and content.
 */
const forEachBlockInTable = (content, block, _blockIndex, cb) => {
    const key = block.getKey();
    const selection = createSelection(key, 0, 1);
    const data = getData(content, key);

    let newContent = content;
    let blockIndex = _blockIndex;

    for (let i = 0; i < (data.numRows || 0); i++) {
        for (let j = 0; j < (data.numCols || 0); j++) {
            let cellEditorState = getCell(data, i, j, null, null);
            let cellContent = cellEditorState.getCurrentContent();

            cellContent.getBlocksAsArray().forEach((_block) => {
                cellContent = cb(++blockIndex, _block, cellContent);
            });

            cellEditorState = EditorState.push(cellEditorState, cellContent, 'insert-characters');
            setCell(data, i, j, cellEditorState);
        }
    }

    newContent = setDataForContent(newContent, selection, block, data);

    return {newContent, blockIndex};
};

/**
 * @name forEachMatch
 * @param {ContentState} content The content to search in.
 * @param {string} pattern The pattern to search by.
 * @param {boolean} caseSensitive Whether the search should be case sensitive or not.
 * @param {function} cb The callback to call for each occurrence. Receives index, selection, block and content.
 * @returns {ContentState} returns  the new content state.
 * @description Searches the content for the given pattern and calls the given callback
 * for each occurrence, passing it current content, index of the match and its SelectionState.
 */
export const forEachMatch = (content, pattern, caseSensitive, cb) => {
    if (!pattern) {
        return false;
    }

    let matchIndex = -1;
    let newContent = content;

    content.getBlocksAsArray().forEach((block) => {
        const entityKey = block.getEntityAt(0);
        const entity = entityKey != null ? content.getEntity(entityKey) : null;

        if (entity != null && entity.getType() === 'TABLE') {
            ({newContent, matchIndex} = forEachMatchInTable(
                newContent, block, pattern, caseSensitive, matchIndex, cb));
        } else {
            ({newContent, matchIndex} = forEachMatchInParagraph(
                newContent, block, pattern, caseSensitive, matchIndex, cb));
        }
    });

    return newContent;
};

/**
 * @name forEachMatchInParagraph
 * @param {ContentState} content The content to search in.
 * @param {Block} the block to search in.
 * @param {string} pattern The pattern to search by.
 * @param {boolean} caseSensitive Whether the search should be case sensitive or not.
 * @param {number} current marching index
 * @param {function} cb The callback to call for each occurrence. Receives index, selection, block and content.
 * @returns {ContentState} returns  the new content state.
 * @description Searches the block for the given pattern and calls the given callback
 * for each occurrence, passing it the index of the match and its SelectionState.
 */
const forEachMatchInParagraph = (content, block, pattern, caseSensitive, _matchIndex, cb) => {
    const re = getRegExp({pattern, caseSensitive});
    const key = block.getKey();
    const text = block.getText();

    let newContent = content;
    let matchIndex = _matchIndex;
    let match;

    // eslint-disable-next-line no-cond-assign
    while (match = re.exec(text)) {
        newContent = cb(
            ++matchIndex,
            createSelection(key, match.index, match.index + match[0].length),
            block,
            newContent,
            match[0],
        );
    }

    return {newContent, matchIndex};
};

/**
 * @name forEachMatchInTable
 * @param {ContentState} content The parent content to search in.
 * @param {Block} the block that contains the table.
 * @param {string} pattern The pattern to search by.
 * @param {boolean} caseSensitive Whether the search should be case sensitive or not.
 * @param {number} current marching index
 * @param {function} cb The callback to call for each occurrence. Receives index, selection, block and content.
 * @returns {ContentState} returns  the new content state.
 * @description Searches the table content for the given pattern and calls the given callback
 * for each occurrence, passing it the index of the match and its SelectionState.
 */
const forEachMatchInTable = (content, block, pattern, caseSensitive, _matchIndex, cb) => {
    const key = block.getKey();
    const selection = createSelection(key, 0, 1);
    const data = getData(content, key);

    let newContent = content;
    let matchIndex = _matchIndex;

    for (let i = 0; i < (data.numRows || 0); i++) {
        for (let j = 0; j < (data.numCols || 0); j++) {
            let cellEditorState = getCell(data, i, j, null, null);
            let cellContent = cellEditorState.getCurrentContent();

            cellContent.getBlocksAsArray().forEach((_block) => {
                ({newContent: cellContent, matchIndex} = forEachMatchInParagraph(
                    cellContent, _block, pattern, caseSensitive, matchIndex, cb));
            });

            cellEditorState = EditorState.push(cellEditorState, cellContent, 'insert-characters');
            setCell(data, i, j, cellEditorState);
        }
    }

    newContent = setDataForContent(newContent, selection, block, data);

    return {newContent, matchIndex};
};

// create reg exp from pattern if neede
const getRegExp = ({pattern, caseSensitive}) =>
    typeof pattern === 'string' ? new RegExp(escapeRegExp(pattern), 'g' + (caseSensitive ? '' : 'i')) : pattern;

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
