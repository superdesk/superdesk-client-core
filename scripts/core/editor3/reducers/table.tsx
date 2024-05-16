import {RichUtils} from 'draft-js';
import {onChange} from './editor3';
import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';
import {getCell, setCell, getData, setData, IEditor3TableData, IEditor3CustomBlockData} from '../helpers/table';
import {CustomEditor3Entity} from '../constants';
import {IEditorStore} from '../store';

/**
 * @description Contains the list of table related reducers.
 */
const table = (state: IEditorStore = {} as IEditorStore, action) => {
    switch (action.type) {
    case 'TOOLBAR_ADD_TABLE': {
        const payload: IEditor3TableData = action.payload;

        return addTable(
            state,
            {
                entityKind: CustomEditor3Entity.TABLE,
                entityData: payload,
            },
        );
    }
    case 'TOOLBAR_ADD_ROW_AFTER':
        return addRowAfter(state);
    case 'TOOLBAR_ADD_COL_AFTER':
        return addColAfter(state);
    case 'TOOLBAR_REMOVE_ROW':
        return removeRow(state);
    case 'TOOLBAR_REMOVE_COL':
        return removeCol(state);
    case 'TOOLBAR_TABLE_HEADER':
        return toggleTableHeader(state);
    case 'TOOLBAR_TABLE_STYLE':
        return toggleTableInlineStyle(state, action.payload);
    case 'TOOLBAR_TABLE_BLOCK_TYPE':
        return toggleTableBlockType(state, action.payload);
    default:
        return state;
    }
};

/**
 * @ngdoc method
 * @name addTable
 * @param {Object} data Table data (numRows, numCols, cells).
 * @description Adds a table into the content.
 */
export const addTable = (
    state: IEditorStore,
    data:
        {entityKind: CustomEditor3Entity.TABLE; entityData: IEditor3TableData}
        | {entityKind: CustomEditor3Entity.MULTI_LINE_QUOTE; entityData: IEditor3TableData}
        | {entityKind: CustomEditor3Entity.CUSTOM_BLOCK; entityData: IEditor3CustomBlockData},
) => {
    const contentState = state.editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(data.entityKind, 'MUTABLE', {data: data.entityData});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    const {editorState} = insertAtomicBlockWithoutEmptyLines(
        state.editorState,
        entityKey,
        ' ',
    );

    return onChange(state, editorState);
};

/**
 * @ngdoc method
 * @name addRowAfter
 * @description Adds a row after the currently active one.
 */
const addRowAfter = (state) =>
    processCells(state, (prevCells, numCols, nRows, i, j, withHeader) => {
        const numRows = nRows + 1;
        const cells = [];

        prevCells.forEach((row, index) => {
            cells.push(row);

            if (index === i) {
                cells.push([]);
            }
        });

        return {data: {cells, numRows, numCols, withHeader}};
    });

/**
 * @ngdoc method
 * @name removeRow
 * @description Removes the currently active row.
 */
const removeRow = (state) =>
    processCells(state, (cells, numCols, nRows, i, j, withHeader) => {
        let numRows = nRows;

        if (numRows > 1) {
            cells.splice(i, 1);
            numRows -= 1;
        }

        return {data: {cells, numRows, numCols, withHeader}};
    });

/**
 * @ngdoc method
 * @name addColAfter
 * @description Adds a column after the currently active one.
 */
const addColAfter = (state) =>
    processCells(state, (cells, numCols, numRows, i, j, withHeader) => ({
        data: {
            numRows: numRows,
            numCols: numCols + 1,
            withHeader: withHeader,
            cells: cells.map((_, ii) =>
                Array.from(new Array(numCols + 1))
                    .map((__, jj) => {
                        if (jj === j + 1) {
                            return null;
                        }

                        let orig = jj;

                        if (jj > j + 1) {
                            orig -= 1;
                        }

                        if (cells[ii] && cells[ii][orig]) {
                            return cells[ii][orig];
                        }

                        return null;
                    })),
        },
    }));

/**
 * @ngdoc method
 * @name removeCol
 * @description Removes the currently active column.
 */
const removeCol = (state) =>
    processCells(state, (prevCells, nCols, numRows, i, j, withHeader) => {
        let numCols = nCols;
        let cells = prevCells;

        if (numCols > 1) {
            numCols -= 1;
            cells = prevCells.map((cell) => {
                cell.splice(j, 1);
                return cell;
            });
        }

        return {data: {cells, numRows, numCols, withHeader}};
    });

/**
 * @ngdoc method
 * @name processCells
 * @param {Function} fn Function that is called with parameters
 * (cells, numCols, numRows, i, j, withHeader) and is expected to return the new
 * data that should be placed on the table entity. The expected return
 * is an object with keys {cells, numRows, numCols}.
 * @description Helper function to help process the cells in the currently active
 * table and transform the entity data to a new form, using a callback function.
 */
export const processCells = (state, fn) => {
    const {activeCell, editorState} = state;

    if (activeCell === null) {
        return state;
    }

    const {i, j, key, currentStyle, selection} = activeCell;
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(key);
    const {cells, numRows, numCols, withHeader} = getData(contentState, block.getKey());
    const {data, newCurrentStyle, popup} = fn(cells, numCols, numRows, i, j, withHeader, currentStyle, selection);
    const newEditorState = setData(editorState, block, data, 'change-block-data');
    let newState = state;

    if (newCurrentStyle !== null) {
        // We have to set the popup to the result from `fn` only when it has
        // been modified so we don't break existing logic checking popup.type
        // when the editor reloads. e.g. after setting an inline style
        if (popup != null) {
            newState = {
                ...state,
                popup,
                activeCell: {
                    ...activeCell,
                    currentStyle: newCurrentStyle,
                    selection: selection,
                },
            };
        } else {
            newState = {
                ...state,
                activeCell: {
                    ...activeCell,
                    currentStyle: newCurrentStyle,
                    selection: selection,
                },
            };
        }
    }

    return onChange(newState, newEditorState, true);
};

/**
 * @ngdoc method
 * @name toggleTableHeader
 * @description Toggles the table's header.
 */
const toggleTableHeader = (state) =>
    processCells(
        state,
        (cells, numCols, numRows, i, j, withHeader, currentStyle) => {
            const newData = {
                cells: cells,
                numRows: numRows,
                numCols: numCols,
                withHeader: !withHeader,
                currentStyle: currentStyle,
            };

            return {
                data: newData,
                newCurrentStyle: currentStyle,
            };
        },
    );

/**
 * @ngdoc method
 * @name toggleTableStyle
 * @description Toggles the table's style.
 */
const toggleTableInlineStyle = (state, inlineStyle) =>
    processCells(
        state,
        (cells, numCols, numRows, i, j, withHeader, currentStyle, selection) => {
            const data = {cells, numRows, numCols, withHeader};
            const cellStateEditor = getCell(data, i, j, currentStyle, selection);
            const newCellEditorState = RichUtils.toggleInlineStyle(cellStateEditor, inlineStyle);
            const newCurrentStyle = newCellEditorState.getCurrentInlineStyle().toArray();
            const newData = setCell(data, i, j, newCellEditorState).data;

            return {
                data: newData,
                newCurrentStyle: newCurrentStyle,
            };
        },
    );

const toggleTableBlockType = (state, blockType) =>
    processCells(
        state,
        (cells, numCols, numRows, i, j, withHeader, currentStyle, selection) => {
            const data: IEditor3TableData = {cells, numRows, numCols, withHeader};
            const cellStateEditor = getCell(data, i, j, currentStyle, selection);
            const newCellEditorState = RichUtils.toggleBlockType(cellStateEditor, blockType);
            const newCurrentStyle = newCellEditorState.getCurrentInlineStyle().toArray();
            const newData = setCell(data, i, j, newCellEditorState).data;

            return {
                data: newData,
                newCurrentStyle: newCurrentStyle,
            };
        },
    );

export default table;
