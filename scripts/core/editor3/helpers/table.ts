import {
    Modifier,
    ContentState,
    SelectionState,
    ContentBlock,
    EditorState,
    convertToRaw,
    convertFromRaw,
    RawDraftContentState,
} from 'draft-js';
import {OrderedSet, Map} from 'immutable';
import {createBlockSelection} from './selection';
import {getBlockKeys} from './selection/blockKeys';

/**
 * Retrieves the editor state of the cell at row/col.
 */
export function getCell(data: IEditor3TableData, row, col, currentStyle, selection): EditorState {
    const {cells} = data;
    let cellEditorState;

    if (!cells[row] || !cells[row][col]) {
        cellEditorState = EditorState.createWithContent(
            ContentState.createFromText(''),
        );
    } else {
        cellEditorState = EditorState.createWithContent(
            convertFromRaw(cells[row][col]),
        );
    }

    if (selection != null) {
        const {anchorKey, focusKey} = selection;
        const cellContentState = cellEditorState.getCurrentContent();
        const anchorBlock = cellContentState.getBlockForKey(anchorKey);
        const focusBlock = cellContentState.getBlockForKey(focusKey);

        if (anchorBlock != null && focusBlock != null) {
            const newSelection = cellEditorState
                .getSelection()
                .merge({...selection});

            cellEditorState = EditorState.forceSelection(
                cellEditorState,
                newSelection,
            );
        }
    }

    if (currentStyle != null) {
        cellEditorState = EditorState.setInlineStyleOverride(
            cellEditorState,
            OrderedSet(currentStyle),
        );
    }

    return cellEditorState;
}

/**
 * @ngdoc method
 * @name TableBlockComponent#setCell
 * @param {Number} row The row of the cell in the table
 * @param {Number} col The column of the cell in the table
 * @param {Object} cellContentState The state of the editor within the cell
 * @description Updates data about this cell inside the entity for this atomic
 * block.
 */
export function setCell(data: IEditor3TableData, row, col, cellEditorState: EditorState) {
    const cellContentState = cellEditorState.getCurrentContent();
    let needUpdate = true;
    let forceUpdate = true;

    if (!data.cells[row]) {
        data.cells[row] = [];
    }

    if (data.cells[row][col]) {
        needUpdate =
            JSON.stringify(data.cells[row][col]) !==
            JSON.stringify(convertToRaw(cellContentState));
        forceUpdate =
            convertFromRaw(data.cells[row][col]).getPlainText() !==
            cellContentState.getPlainText();
    }

    data.cells[row][col] = convertToRaw(cellContentState);

    return {data, needUpdate, forceUpdate};
}

/**
 * @ngdoc method
 * @name getData
 * @param {Object} contentState The editor content state
 * @param {String} blockKey The current atomic block key
 * @description Returns the data contained in the entity of this atomic block.
 * @return {Object}
 */
export function getData(contentState: ContentState, blockKey: string) {
    const block = contentState.getBlockForKey(blockKey);
    const entityKey = block.getEntityAt(0);
    const {data} = contentState.getEntity(entityKey).getData();
    const blockData = block.getData().get('data');

    if (!blockData && data) {
        return data;
    }

    return JSON.parse(blockData);
}

export interface IEditor3TableData {
    cells: Array<Array<RawDraftContentState>>;
    numRows: number;
    numCols: number;
    withHeader: boolean;
    currentStyle?: string;
}

/**
 * @ngdoc method
 * @name setData
 * @param {Object} contentState The editor content state
 * @param {Object} block The current atomic block
 * @description Returns EditorState with the data contained in the entity of this atomic block.
 * @return {Object}
 */
export function setData(
    editorState: EditorState,
    block: ContentBlock,
    data: IEditor3TableData,
    lastChangeType,
): EditorState {
    const contentState = editorState.getCurrentContent();
    const selection = createBlockSelection(editorState, block);
    const newContentState = setDataForContent(contentState, selection, block, data);
    const newEditorState = EditorState.push(
        editorState,
        newContentState,
        lastChangeType,
    );

    return newEditorState;
}

/**
 * @ngdoc method
 * @name setDataForContent
 * @param {Object} contentState The editor content state
 * @param {Object} block The current atomic block
 * @description Returns ContentState with the data contained in the entity of this atomic block.
 * @return {Object}
 */
export function setDataForContent(
    contentState: ContentState,
    selection: SelectionState,
    block: ContentBlock,
    data: IEditor3TableData,
): ContentState {
    const entityKey = block.getEntityAt(0);
    const newContentState = Modifier.setBlockData(
        contentState,
        selection,
        Map().set('data', JSON.stringify(data)),
    );

    newContentState.replaceEntityData(entityKey, {data});

    return newContentState;
}

export function getTableWithSingleCell(
    editorState: EditorState,
    initializeWithSelectedText: boolean,
): IEditor3TableData {
    const initialCellData: RawDraftContentState | null = (() => {
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();

        if (initializeWithSelectedText && !selectionState.isCollapsed()) {
            // Get user selected content
            const selectedBlocks = getBlockKeys(contentState, selectionState.getStartKey(), selectionState.getEndKey())
                .map((key) => contentState.getBlockForKey(key));

            return convertToRaw(ContentState.createFromBlockArray(selectedBlocks));
        } else {
            return null;
        }
    })();

    const data: IEditor3TableData = {
        cells: initialCellData == null ? [[]] : [[initialCellData]],
        numRows: 1,
        numCols: 1,
        withHeader: false,
    };

    return data;
}
