import {RichUtils} from 'draft-js';
import {onChange} from './editor3';
import insertAtomicBlockWithoutEmptyLines from '../helpers/insertAtomicBlockWithoutEmptyLines';
import {getCell, setCell, getData, setData, IEditor3TableData, IEditor3CustomBlockData} from '../helpers/table';
import {CustomEditor3Entity} from '../constants';
import {IEditorStore} from '../store';
import {IActiveCell} from '../components/tables/TableBlock';

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
    processCells(state, (tableData, activeCell) => {
        const {i} = activeCell;
        const {cells, numRows} = tableData;


        const nextCells = [];

        cells.forEach((row, index) => {
            nextCells.push(row);

            if (index === i) {
                nextCells.push([]);
            }
        });

        return {
            data: {
                ...tableData,
                cells: nextCells,
                numRows: numRows + 1,
            },
        };
    });

/**
 * @ngdoc method
 * @name removeRow
 * @description Removes the currently active row.
 */
const removeRow = (state) =>
    processCells(state, (tableData, activeCell) => {
        const {cells} = tableData;
        const nRows = tableData.numRows;
        let numRows = nRows;

        if (numRows > 1) {
            cells.splice(activeCell.i, 1);
            numRows -= 1;
        }

        return {
            data: {
                ...tableData,
                cells,
                numRows,
            },
        };
    });

/**
 * @ngdoc method
 * @name addColAfter
 * @description Adds a column after the currently active one.
 */
const addColAfter = (state) =>
    processCells(state, (tableData, activeCell) => {
        const {cells, numCols} = tableData;
        const {j} = activeCell;

        return {
            data: {
                ...tableData,
                numCols: tableData.numCols + 1,
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
        };
    });

/**
 * @ngdoc method
 * @name removeCol
 * @description Removes the currently active column.
 */
const removeCol = (state) =>
    processCells(state, (tableData, activeCell) => {
        const {j} = activeCell;
        const prevCells = tableData.cells;
        let numCols = tableData.numCols;
        let cells = prevCells;

        if (numCols > 1) {
            numCols -= 1;
            cells = prevCells.map((cell) => {
                cell.splice(j, 1);
                return cell;
            });
        }

        return {
            data: {
                ...tableData,
                cells,
                numCols,
            },
        };
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
export const processCells = (
    state: IEditorStore,
    fn: (tableData: IEditor3TableData | IEditor3CustomBlockData, activeCell: IActiveCell) =>
        {data: IEditor3TableData | IEditor3CustomBlockData; newCurrentStyle?: any; popup?: any},
) => {
    const {activeCell, editorState} = state;

    if (activeCell === null) {
        return state;
    }

    const {key, selection} = activeCell;
    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(key);
    const tableData = getData(contentState, block.getKey());

    const {data, newCurrentStyle, popup} = fn(tableData, activeCell);
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
        (tableData, activeCell) => {
            return {
                data: {
                    ...tableData,
                    withHeader: !tableData.withHeader,
                },
                newCurrentStyle: activeCell.currentStyle,
            };
        },
    );

/**
 * @ngdoc method
 * @name toggleTableStyle
 * @description Toggles the table's style.
 */
const toggleTableInlineStyle = (state: IEditorStore, inlineStyle) => {
    return processCells(
        state,
        (tableData, activeCell) => {
            const {i, j, currentStyle, selection} = activeCell;
            const cellStateEditor = getCell(tableData, i, j, currentStyle, selection);
            const newCellEditorState = RichUtils.toggleInlineStyle(cellStateEditor, inlineStyle);
            const newCurrentStyle = newCellEditorState.getCurrentInlineStyle().toArray();
            const tableDataNext: IEditor3TableData | IEditor3CustomBlockData =
                setCell(tableData, i, j, newCellEditorState).data;

            return {
                data: {
                    ...tableData,
                    ...tableDataNext,
                },
                newCurrentStyle: newCurrentStyle,
            };
        },
    );
};

const toggleTableBlockType = (state, blockType) =>
    processCells(
        state,
        (tableData, activeCell) => {
            const {i, j, currentStyle, selection} = activeCell;
            const cellStateEditor = getCell(tableData, i, j, currentStyle, selection);
            const newCellEditorState = RichUtils.toggleBlockType(cellStateEditor, blockType);
            const newCurrentStyle = newCellEditorState.getCurrentInlineStyle().toArray();
            const tableDataNext: IEditor3TableData | IEditor3CustomBlockData =
                setCell(tableData, i, j, newCellEditorState).data;

            return {
                data: {
                    ...tableData,
                    ...tableDataNext,
                },
                newCurrentStyle: newCurrentStyle,
            };
        },
    );

export default table;
